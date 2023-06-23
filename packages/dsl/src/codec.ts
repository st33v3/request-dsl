export type DefaultBody = AsyncIterable<Uint8Array>;

/**
 * Representation of input and output of BodyCodec. Core field is `value`, which contains
 * value being transformed by BodyCodec. Other fields allow shortcutting most common transformations such as to/from JSON
 * or string.
 * CodecData represent future transformation - nothing is transformed or retrieved until value() or
 * similar method is called.
 * CodeData is referentially transparent and may be safely created and droped
 */
export interface CodecData<T> {
    value(): Promise<T>;
    asString?(): Promise<string>;
    asJson?(): Promise<unknown>;
}

/**
 * Describes future transformation of value of type I to value of type O. Once called with
 * CodecData containing input value it responds with modified CodecData with applied transformation.
 * Transformation creation (codec chaining) may contain conditional logic, but the conditions may not depend on
 * transformed value itself - assume that input value may be stream and the stream can not be restarted.
 */
export interface BodyCodec<I, O> {
    /**
     * Transforms CodecData of I to CodecDdata of O 
     */
    (input: CodecData<I>): CodecData<O>;
    map<O1>(f: (o:O) => O1 | PromiseLike<O1>): BodyCodec<I, O1>;
    contramap<I1>(f: (i:I1) => I | PromiseLike<I>): BodyCodec<I1, O>;
    flatMap<O1>(f: (o: O) => BodyCodec<O, O1>): BodyCodec<I, O1>;
    via<O1>(codec: BodyCodec<O, O1>): BodyCodec<I, O1>;
}
export namespace BodyCodec {

    export function wrap<I,O>(self: (i: CodecData<I>) => CodecData<O>): BodyCodec<I, O> {
        //Bind clones the function, so properties can be set and not overwritten
        return Object.assign(self.bind({}), {
            map<O1>(f: (o:O) => O1 | PromiseLike<O1>): BodyCodec<I, O1> {
                return wrap(data => ({value: () => self(data).value().then(f)}));
            },
            flatMap<O1>(f: (o:O) => BodyCodec<O, O1>): BodyCodec<I, O1> {
                return wrap<I, O1>(data => ({
                    value: () => self(data).value().then(v => {
                        const codec = f(v);
                        return codec({value: () => Promise.resolve(v)}).value();
                    })
                }));
            },
            contramap<I1>(f: (i:I1) => I | PromiseLike<I>): BodyCodec<I1, O> {
                return wrap<I1, O>(data => self({value: () => data.value().then(f)}));
            },
            via<O1>(codec: BodyCodec<O, O1>): BodyCodec<I, O1> {
                return wrap(data => codec(self(data)));
            },
        });
    }
    
    export function fromFunction<I, O>(f: (i: I) => O | PromiseLike<O>): BodyCodec<I, O> {
        return wrap<I, O>(data => ({value: () => data.value().then(f)}));
    }
    export function defaultCodec(): BodyCodec<DefaultBody, DefaultBody> {
        return wrap((i) => i);
    }

    export function drainCodec(): BodyCodec<DefaultBody, undefined> {
        async function drain(data: CodecData<DefaultBody>): Promise<undefined> {
            if (data.asString) await data.asString();
            else for await (const buf of await data.value()) { /**/ } 
            return undefined;
        }

        return wrap(data => ({value: () => drain(data)}));
    }

    export type SelectCodecType<CS extends Array<unknown>, O = never, I = unknown> = CS extends [[string, BodyCodec<infer CI, infer CO>], ...infer CSS] ? SelectCodecType<CSS, O | CO, I & CI> : BodyCodec<I, O>;

    export function select<CS extends Array<[string, BodyCodec<any, any>]>>(selector: (headers: Record<string, string>) => string, ...variants: CS): SelectCodecType<CS> {
        throw new Error();
    }

    export function toString(encoding?: string): BodyCodec<DefaultBody, string> {
        return wrap((i) => {
            function str() {
                return i.asString && !encoding ? i.asString() : makeString(i.value(), encoding);
            } 
            return {
                value: str,
                asString: str,
            };
        });
    }

    export function toJson(): BodyCodec<DefaultBody, unknown> {
        return wrap((i) => {
            function json() {
                if (i.asJson) return i.asJson();
                if (i.asString) i.asString().then(s => JSON.parse(s));
                return makeString(i.value()).then(s => JSON.parse(s));
            }
            return {
                value: json,
                asJson: json,
            };
        });
    }

    export function fromString(encoding?: string): BodyCodec<string, DefaultBody> {
        if (encoding && encoding !== "utf8") throw new Error("Unsupported encoding " + encoding);
        return wrap((i) => {
            return {
                value: () => makeBuffer(i.value()),
                asString: i.value,
            };
        });
    }

    export function fromJson(): BodyCodec<unknown, DefaultBody> {
        return wrap((i) => {
            return {
                value: () => makeBuffer(i.value().then(v => JSON.stringify(v))),
                asJson: i.value,
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

    export function emptyBody(): CodecData<DefaultBody> {
        return {
            value() {return Promise.resolve(iterable()) },
            asString() {return Promise.resolve("") },
        }
    }
}

//const g = BodyCodec.select(rec => rec["a"], ["s", BodyCodec.toString()], ["n", BodyCodec.toString().map(s => parseInt(s))]);