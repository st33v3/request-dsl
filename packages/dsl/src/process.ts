import type { RequestFactory } from "./factory";
import type { SimpleRequestTransform2 } from "./transform";

//https://github.com/microsoft/TypeScript/issues/31751
//never is an empty union, therefore conditional is being distributed as if it was ((A | B) extends ... is converted to  A extends ... | B extends ...), which leads back to never, need to use [never]

export type RunArgs<A, B> = [keyof A] extends [never]
    ? ([unknown] extends [B]
        ? []
        : [body: () => B | PromiseLike<B>])
    : ([unknown] extends [B] 
        ? [args: A]
        : [args: A, body: () => B | PromiseLike<B>]);

export type CombineBodies<B1, B2> = [B1] extends [undefined] ? B2 : B1;

export interface ApiRequest<A, B, R> {
    (...args: RunArgs<A, B>): Promise<R>;
    withAbort(abort: AbortSignal, ...args: RunArgs<A, B>): Promise<R>;
    map<T>(f: (r: R) => T | Promise<T>): ApiRequest<A, B, T>;
    contramap<T>(f: (r: B) => T | Promise<T>): ApiRequest<A, B, T>;
    apply(args: A): ApiRequest<{}, B, R>;
    flatMap<A1, B1 extends ((B extends undefined ? any : B) | undefined), T>(f: (r: R) => ApiRequest<A1, B1, T>): ApiRequest<A & A1, CombineBodies<B, B1>, T>;
    zip<A1, B1 extends ((B extends undefined ? any : B) | undefined), T>(req: ApiRequest<A1, B1, T>): ApiRequest<A & A1, CombineBodies<B, B1>, [R, T]>;
}

export interface RequestProcessor {
    <A, B, R>(req: RequestFactory<A, B, R>): ApiRequest<A, B, R>;
    /**
     * Applies provided transformation on every request factory supplied to the processor.
     * @param t 
     */
    contramap(t: SimpleRequestTransform2): RequestProcessor
}

export namespace RequestProcessor {
    export function wrap(self: <A, B, R>(req: RequestFactory<A, B, R>) => ApiRequest<A, B, R>): RequestProcessor {
        return Object.assign(self.bind({}), {
            contramap(t: SimpleRequestTransform2): RequestProcessor {
                return wrap(req => self(t(req)));
            }
        });
    }
}

export function parseFunctionArgs(args: unknown[]): [args: {}, body: (() => any | PromiseLike<any>) | undefined] {
    let body: (() => any | PromiseLike<any>) | undefined = undefined;
    let as = {};
    let cnt = args.length;
    cnt--;
    if (cnt > 1) throw new Error("Too many arguments");
    const b = args[cnt];
    if (typeof b !== "function" && cnt > 0) throw new Error("Body argument (" + cnt + ") must be a function");
    if (typeof b === "function") {
        cnt--;
        body = b as any;
    }
    if (cnt >= 0) {
        const a = args[0];
        if (typeof a !== "object") throw new Error("Call arguments argument (" + cnt + ") must be an object");
        as = a as any;
    }
    return [as, body];
}