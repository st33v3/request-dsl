import { BodyCodec, DefaultBody } from "./codec";
import { RequestFactory } from "./factory";
import { RequestTransform, SetBodyTransform } from "./transform";

export function reset<A extends {}, B, R>(): RequestTransform<A, B, R, A, never, R> {
}

export function provide<A extends {}, B, R>(body: () => B | Promise<B>): RequestTransform<A, B, R, A, never, R> {
    return factory => {
        return ctx => {
            return RequestFactory.wrap();
        };
    }
}

export function contramap<A extends {}, B1, R, B2>(f: (b: B2) => B1 | Promise<B1>): RequestTransform<A, B1, R, A, B2, R> {
    return factory => {
        return ctx => {
            return RequestFactory.wrap();
        };
    }
}

export function use<A extends {}, B1, R, B2>(codec: BodyCodec<B2, B1>): RequestTransform<A, B1, R, A, B2, R> {
    return factory => {
        return ctx => {
            return RequestFactory.wrap();
        };
    }
}

export function init(): SetBodyTransform<DefaultBody> {

}

/**
 * will also set Content-Type header to 'text/plain'
 * @param cnv 
 */
export function string(): SetBodyTransform<string> {

}

/**
 * will also set Content-Type header to 'application/json'
 * @param cnv optinal conversion/vaidation of body object to JSON material. Body object will be passed through JSON.stringify 
 */
export function json<B = unknown>(cnv?: (b: B) => unknown): SetBodyTransform<B> {

}


const all = { provide, reset, contramap, use, init, string, json };

export {all as default};
