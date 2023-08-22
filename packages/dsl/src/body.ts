import { BodyCodec, DefaultBody } from "./codec";
import { RequestFactory } from "./factory";
import { RequestTransform, SetBodyTransform } from "./transform";
import { contentType } from "./headers";

export function reset<A extends {}, B, R>(): RequestTransform<A, B, R, A, never, R> {
    throw "TODO - Unimplemented";
}

export function provide<A extends {}, B, R>(body: () => B | Promise<B>): RequestTransform<A, B, R, A, never, R> {
    return factory => {
        throw "TODO - Unimplemented";
    }
}

export function contramap<A extends {}, B1, R, B2>(f: (b: B2) => B1 | Promise<B1>): RequestTransform<A, B1, R, A, B2, R> {
    return factory => {
        throw "TODO - Unimplemented";
    }
}

export function use<A extends {}, B1, R, B2>(codec: BodyCodec<B2, B1>): RequestTransform<A, B1, R, A, B2, R> {
    return factory => {
        throw "TODO - Unimplemented";
    }
}

export function init(): SetBodyTransform<DefaultBody> {
    throw "TODO - Unimplemented";
}

/**
 * will also set Content-Type header to 'text/plain'
 * @param cnv 
 */
export function string(): SetBodyTransform<string> {
    throw "TODO - Unimplemented";
}

/**
 * will also set Content-Type header to 'application/json'
 * @param cnv optinal conversion/vaidation of body object to JSON material. Body object will be passed through JSON.stringify 
 */
export function json<B = unknown>(cnv?: (b: B) => unknown): SetBodyTransform<B> {
    return <A extends {}, B1, R> (factory: RequestFactory<A, B1, R>) => {
        const ret = RequestFactory.wrap<A, B, R>((ctx) => {
            const old: () => Promise<B1> = () => Promise.reject("Internal error, replaced body should not be used");
            const data = factory({...ctx, body: old});
            const body = BodyCodec.fromJson()({value: () => ctx.body().then(b => cnv ? cnv(b) : b )})
            return {...data, body}
        });
        return ret.apply(contentType("application/json"));
    }
}


const all = { provide, reset, contramap, use, init, string, json };

export {all as default};
