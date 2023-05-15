import { BodyCodec } from "./codec";
import { RequestFactory } from "./factory";
import { RequestTransform } from "./transform";

export function provide<A, B, R>(body: () => B | Promise<B>): RequestTransform<A, B, R, A, undefined, R> {
    return factory => {
        return ctx => {
            return RequestFactory.wrap();
        };
    }
}

export function contramap<A, B1, R, B2>(f: (b: B2) => B1 | Promise<B1>): RequestTransform<A, B1, R, A, B2, R> {
    return factory => {
        return ctx => {
            return RequestFactory.wrap();
        };
    }
}

export function use<A, B1, R, B2>(codec: BodyCodec<B2, B1>): RequestTransform<A, B1, R, A, B2, R> {
    return factory => {
        return ctx => {
            return RequestFactory.wrap();
        };
    }
}

const all = { provide };

export {all as default};
