import type { RequestData, RequestFactory } from "./factory";
import { RequestTransform, SimpleRequestTransform2 } from "./transform";

//https://github.com/microsoft/TypeScript/issues/31751
//never is an empty union, therefore conditional is being distributed as if it was ((A | B) extends ... is converted to  A extends ... | B extends ...), which leads back to never, need to use [never]

export type RunArgs<A, B> = [keyof A] extends [never]
    ? ([B] extends [never]
        ? []
        : [body: () => B | PromiseLike<B>])
    : ([B] extends [never] 
        ? [args: A]
        : [args: A, body: () => B | PromiseLike<B>]);


export interface RequestExecutor<A extends {}, B, R> {
    (abort: AbortSignal | undefined, args: () => A | PromiseLike<A>, body: () => B | PromiseLike<B>): Promise<R>;
}

//export type CombineBodies<B1, B2> = [B1] extends [undefined] ? B2 : B1;

export interface ApiRequest<A extends {}, B, R> {
    (...args: RunArgs<A, B>): Promise<R>;
    withAbort(abort: AbortSignal, ...args: RunArgs<A, B>): Promise<R>;
    map<T>(f: (r: R) => T | PromiseLike<T>): ApiRequest<A, B, T>;
    contramap<T>(f: (r: T) => B | PromiseLike<B>): ApiRequest<A, T, R>;
    /**
     * Convert API request that requires arguments to argument-less request. Suitable for 
     * scenarions where passing requests to code that does not support arguments.
     * @param args actual or promised arguments provided either as a value or a function. 
     */
    provideAll(args: A | PromiseLike<A> | (() => A | PromiseLike<A>)): ApiRequest<{}, B, R>;
    /**
     * 
     * @param f
     * @experimental
     */
    flatMap<A1 extends {}, B1 extends ([B] extends [never] ? any : B), T>(f: (r: R) => ApiRequest<A1, B1, T>): ApiRequest<A & A1, B | B1, T>;
    /**
     * 
     * @param req 
     * @experimental
     */
    zip<A1 extends {}, B1 extends ([B] extends [never] ? any : B), T>(req: ApiRequest<A1, B1, T>): ApiRequest<A & A1, B | B1, [R, T]>;
    run(abort: AbortSignal | undefined, args: A | PromiseLike<A> | (() => A | PromiseLike<A>), body: () => B | PromiseLike<B>): Promise<R>;
}

export namespace ApiRequest {
    export function wrap<A extends {}, B, R>(
        executor: RequestExecutor<A, B, R>,
    ): ApiRequest<A, B, R> {

        async function awt<P>(v: P | PromiseLike<P>): Promise<P> {
            return await v;
        }
    
        async function run(abort: AbortSignal | undefined, args: A | PromiseLike<A> | (() => A | PromiseLike<A>), body: () => B | PromiseLike<B>): Promise<R> {
            const args0 = args instanceof Function  ? args : () => args;
            return await executor(abort, args0, body);
        }
        
        function self(...args0: RunArgs<A, B>) {
            const [args, body] = parseFunctionArgs(args0);
            return run(undefined, args as any, body);
        }

        return Object.assign(self.bind({}), {
            withAbort(abort: AbortSignal, ...args0: RunArgs<A, B>): Promise<R> {
                const [args, body] = parseFunctionArgs(args0);
                return run(abort, args as any, body);
            },
            map<T>(f: (r: R) => T | PromiseLike<T>): ApiRequest<A, B, T> {
                return wrap<A, B, T>((s, a, b) => executor(s, a, b).then(f));
            },
            contramap<T>(f: (r: T) => B | PromiseLike<B>): ApiRequest<A, T, R> {
                return wrap<A, T, R>((s, a, b) => executor(s, a, () => awt(b()).then(f)));
            },
            provideAll(args: A | PromiseLike<A> | (() => A | PromiseLike<A>)): ApiRequest<{}, B, R> {
                const args0 = args instanceof Function  ? args : () => args;
                return wrap<{}, B, R>((s, a, b) => executor(s, args0, b));
            },
            flatMap<A1 extends {}, B1 extends ([B] extends [never] ? any : B), T>(f: (r: R) => ApiRequest<A1, B1, T>): ApiRequest<A & A1, B | B1, T> {
                return wrap<A & A1, B | B1, T>(async (s, a, b) => {
                    const res = await executor(s, a, b);
                    const other = f(res);
                    return await other.run(s, a, b as any);
                });
            },
            zip<A1 extends {}, B1 extends ([B] extends [never] ? any : B), T>(req: ApiRequest<A1, B1, T>): ApiRequest<A & A1, B | B1, [R, T]> {
                return wrap<A & A1, B | B1, [R, T]>(async (s, a, b) => {
                    const res = executor(s, a, b);
                    const other = req.run(s, a, b as any);
                    const ret = await Promise.all([res, other]);
                    return ret;
                });
            },
            run,
        });
    }
}

export function parseFunctionArgs(args: unknown[]): [args: {} | Promise<{}>, body: () => any | PromiseLike<any>] {
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
    return [as, body ?? (() => Promise.reject(new Error("Body not provided")))];
}

