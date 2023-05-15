export type DefaultBody = AsyncIterable<Uint8Array>;

/**
 * Representation of input and output of BodyCodec. Core field is `value`, which contains
 * value being transformed by BodyCodec. Other field carry additional information about
 * conversion being made and allow shortcutting most common transformations such as to/from JSON
 * or string.
 */
export interface CodecData<T> {
    status: number;
    value(): Promise<T>;
    headers: Record<string, string>;
    aux: unknown;
    inString?(): Promise<string>;
    inJson?(): Promise<unknown>;
    outString?(): Promise<string>;
    outJson?(): Promise<unknown>;
}

/**
 * Describes future transformation of value of type I to value of type O. Once called with
 * CodecData containing input value it responds with modified CodecData with applied transformation.
 * Transformation creation (codec chaining) may contain conditional logic, but the conditions may not depend on
 * transformed value itself - assume that input value may be stream and the stream can not be restarted.
 */
export interface BodyCodec<I, O> {
    /**
     * Transforms CodecData of I to CodecDdata of O or signals that transformation is not possible.
     */
    (input: CodecData<I>): undefined | CodecData<O>;
    map<O1>(f: (o:O) => O1 | PromiseLike<O1>): BodyCodec<I, O1>;
    contramap<I1>(f: (i:I1) => I | PromiseLike<I>): BodyCodec<I1, O>;
    via<O1>(codec: BodyCodec<O, O1>): BodyCodec<I, O1>;
    when(t: (status: number, headers: Record<string, string>, aux: unknown) => boolean): BodyCodec<I, O>;
    otherwise<O1>(other: BodyCodec<I, O1>): BodyCodec<I, O | O1>;
}
export namespace BodyCodec {

    function mapData<A, B>(d: CodecData<A> | undefined, map: (a:A) => B | PromiseLike<B>): CodecData<B> | undefined {
        if (!d) return undefined;
        return {
            status: d.status,
            headers: d.headers,
            aux: d.aux,
            value:() => d.value().then(map),
        };
    }

    export function wrap<I,O>(self: (i: CodecData<I>) => undefined | CodecData<O>): BodyCodec<I, O> {
        //Bind clones the function to create new object, so properties can be set
        return Object.assign(self.bind({}), {
            map<O1>(f: (o:O) => PromiseLike<O1>): BodyCodec<I, O1> {
                return wrap(i => mapData(self(i), f));
            },
            contramap<I1>(f: (i:I1) => PromiseLike<I>): BodyCodec<I1, O> {
                return wrap<I1, O>(i => {
                    const i2 = mapData(i, f)
                    return i2 ? self(i2) : undefined;
                });
            },
            via<O1>(codec: BodyCodec<O, O1>): BodyCodec<I, O1> {
                return wrap(i => {
                    const o = self(i);
                    return o ? codec(o) : undefined;
                });
            },
            when(t: (status: number, headers: Record<string, string>, aux: unknown) => boolean) {
                return wrap<I, O>(i => t(i.status, i.headers, i.aux) ? self(i) : undefined);
            },
            otherwise<O1>(other: BodyCodec<I, O1>) {
                return wrap<I, O | O1>(i => {
                    const ret = self(i);
                    return ret ? ret : other(i);
                });
            }
        });
    }
    
    export function defaultDecoder(): BodyCodec<DefaultBody, DefaultBody> {
        return wrap((i) => i);
    }

    export function drainCodec(): BodyCodec<DefaultBody, undefined> {
        async function drain(str: (() => Promise<string>) | undefined, iter: () => Promise<DefaultBody>): Promise<undefined> {
            if (str) await str();
            else for await (const buf of await iter()) { /**/ } 
            return undefined;
        }

        return wrap((i) => ({
            value: () => drain(i.inString, i.value),
            headers: i.headers,
            status: i.status,
            aux: i.aux,
        }));
    }

    export type SelectCodecType<CS extends Array<unknown>, O = never, I = unknown> = CS extends [[string, BodyCodec<infer CI, infer CO>], ...infer CSS] ? SelectCodecType<CSS, O | CO, I & CI> : BodyCodec<I, O>;

    export function select<CS extends Array<[string, BodyCodec<any, any>]>>(selector: (headers: Record<string, string>) => string, ...variants: CS): SelectCodecType<CS> {
        throw new Error();
    }

    export function voidDecoder(): BodyCodec<any, never> {
        return wrap(() => undefined);
    }

    export function toString(encoding?: string): BodyCodec<DefaultBody, string> {
        return wrap((i) => {
            function str() {
                return i.inString && !encoding ? i.inString() : makeString(i.value(), encoding);
            } 
            return {
                value: str,
                inString: str,
                headers: i.headers,
                status: i.status,
                aux: i.aux,
            };
        });
    }

    export function toJson(): BodyCodec<DefaultBody, unknown> {
        return wrap((i) => {
            function json() {
                return i.inJson ? i.inJson() : makeString(i.value()).then(s => JSON.parse(s));
            }
            return {
                value: json,
                inJson: json,
                headers: i.headers,
                status: i.status,
                aux: i.aux,
            };
        });
    }

    export function fromString(encoding?: string): BodyCodec<string, DefaultBody> {
        return wrap((i) => {
            return {
                value: () => makeBuffer(i.value()),
                outString: i.value,
                headers: i.headers,
                status: i.status,
                aux: i.aux,
            };
        });
    }

    export function fromJson(): BodyCodec<unknown, DefaultBody> {
        return wrap((i) => {
            return {
                value: () => makeBuffer(i.value().then(v => JSON.stringify(v))),
                outJson: i.value,
                headers: i.headers,
                status: i.status,
                aux: i.aux,
            };
        });
    }

    const empty = new Uint8Array(0);
    
    async function makeString(it: Promise<DefaultBody>, encoding?: string): Promise<string> {
        const decoder = new TextDecoder(encoding);
        let ret = "";
        const chunks = await it;
        for await (const chunk of chunks) {
            ret += decoder.decode(chunk, {stream: true});
        }
        ret += decoder.decode(empty, {stream: false});
        return ret;
    }

    async function* iterable(...arrs: Uint8Array[]): AsyncIterable<Uint8Array> {
        for (const arr of arrs) {
            yield arr;
        }
    }

    async function makeBuffer(str: Promise<string>): Promise<DefaultBody> {
        const encoder = new TextEncoder();
        const s = await str;
        return iterable(encoder.encode(s));
    }
}

const g = BodyCodec.select(rec => rec["a"], ["s", BodyCodec.toString()], ["n", BodyCodec.toString().map(s => parseInt(s))]);