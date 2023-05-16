import { BodyCodec } from "./codec";

export type DefaultBody = AsyncIterable<Uint8Array>;

/**
 * Input for body decoding resolution process - ResponseDecoder takes the paramaters to find
 * appropriate BodyCodec
 */
export interface ResponseContext {
    status: number;
    headers: Record<string, string>;
    aux: unknown;
}

/**
 * Based or response metadata selects appropriate BodyCodec. Decoders may be nested
 * to add furhter functionality.
 */
export interface ResponseDecoder<T> {
    /**
     * Transforms ResponseContext or signals that transformation is not possible.
     */
    (input: ResponseContext): undefined | BodyCodec<DefaultBody, T>;
    map<U>(f: (o: T) => U | PromiseLike<U>): ResponseDecoder<U>;
    use<U>(c: BodyCodec<T, U>): ResponseDecoder<U>;
    when(t: (ctx: ResponseContext) => boolean): ResponseDecoder<T>;
    otherwise<U>(other: ResponseDecoder<U>): ResponseDecoder<T | U>;
}
export namespace ResponseDecoder {

    export function wrap<T>(self: (ctx: ResponseContext) => undefined | BodyCodec<DefaultBody, T>): ResponseDecoder<T> {
        //Bind clones the function, so properties can be set instead or overwritten
        return Object.assign(self.bind({}), {
            map<U>(f: (o: T) => U | PromiseLike<U>): ResponseDecoder<U> {
                const codec = BodyCodec.fromFunction(f);
                return wrap(ctx => self(ctx)?.via(codec));
            },
            use<U>(codec: BodyCodec<T, U>): ResponseDecoder<U> {
                return wrap(ctx => self(ctx)?.via(codec));
            },
            when(t: (ctx: ResponseContext) => boolean) {
                return wrap<T>(ctx => t(ctx) ? self(ctx) : undefined);
            },
            otherwise<U>(other: ResponseDecoder<U>): ResponseDecoder<T | U> {
                return wrap<T | U>(ctx => self(ctx) ?? other(ctx));
            }
        });
    }
    
    export function voidDecoder(): ResponseDecoder<never> {
        return wrap(() => undefined);
    }

    export function fromCodec<T>(codec: BodyCodec<DefaultBody, T>): ResponseDecoder<T> {
        return wrap(() => codec);
    }

    export type SelectDecoderType<CS extends Array<unknown>, O = never> = CS extends [[string, ResponseDecoder<infer CO>], ...infer CSS] ? SelectDecoderType<CSS, O | CO> : ResponseDecoder<O>;

    export function select<CS extends Array<[string, ResponseDecoder<any>]>>(selector: (headers: Record<string, string>) => string, ...variants: CS): SelectDecoderType<CS> {
        throw new Error();
    }

}