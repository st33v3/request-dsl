import { ApiRequest, RequestExecutor } from "./api-request";
import type { RequestFactory } from "./factory";
import { RequestTransform, SimpleRequestTransform2 } from "./transform";

export type ApiRequestObj<P extends {}, O extends Record<string, RequestFactory<any, any, any>>> = {[K in keyof O]: O[K] extends RequestFactory<infer IA extends P, infer IB, infer IR> ? ProvidedApiRequest<IA, IB, IR, P> : never };

type ProvidedApiRequest<A extends P, B, R, P extends {}> = ApiRequest<Omit<A, keyof P>, B, R>;
export interface RequestProcessor<P extends {}> {
    <A extends P, B, R>(req: RequestFactory<A, B, R>): ProvidedApiRequest<A, B, R, P>;
    /**
     * Applies provided transformation on every request factory supplied to the processor.
     * @param t 
     */
    prepend(tr: (a: P) => SimpleRequestTransform2 | Promise<SimpleRequestTransform2>): RequestProcessor<P>;
    provide<P1 extends {}>(f: (a: P) => P1 | PromiseLike<P1>): RequestProcessor<P1>;
    /**
     * Utility method to convert object containing request factories to object containing API requests. Use
     * to prevent invoking request processor repeatedly.
     * @param o object containing request factories to be converted
     */
    processObject<O extends Record<string, RequestFactory<any, any, any>>>(o: O): ApiRequestObj<P, O>;
}

export type RequestRunner = <A extends {}, B, R>(abort: AbortSignal | undefined, args: A, body: () => B | PromiseLike<B>, fac: RequestFactory<A, B, R>) => Promise<R>;
export namespace RequestProcessor {
    async function awt<P>(v: P | PromiseLike<P>): Promise<P> {
        return await v;
    }

    export function wrap<P extends {}>(
        provided: () => Promise<[P, SimpleRequestTransform2]>,
        runner: RequestRunner,
    ): RequestProcessor<P> {

        function self<A extends P, B, R>(factory: RequestFactory<A, B, R>): ProvidedApiRequest<A, B, R, P> {
            const executor: RequestExecutor<Omit<A, keyof P>, B, R> = async (abort, args, body) => {
                const [p, t] = await provided();
                const a = await args();
                const realArgs: A = {... a, ...p} as any;
                return await runner(abort, realArgs, body, t(factory));    
            };
            return ApiRequest.wrap(executor);
        }

        return Object.assign(self.bind({}), {
            prepend(f: (a: P) => SimpleRequestTransform2 | Promise<SimpleRequestTransform2>): RequestProcessor<P> {
                return wrap(
                    () => provided().then(p => awt(f(p[0])).then(t => [p[0], t])),
                    runner,
                );
            },
            provide<P1 extends {}>(f: (a: P) => P1 | PromiseLike<P1>): RequestProcessor<P1> {
                return wrap<P1>(
                    () => provided().then(p => awt(f(p[0])).then(p2 => [p2, p[1]])),
                    runner,
                );
            },
            processObject<O extends Record<string, RequestFactory<any, any, any>>>(o: O): ApiRequestObj<P, O> {
                const ret: Record<string, ApiRequest<any, any, any>> = {};
                for (const k in o) {
                    if (Object.hasOwn(o, k)) {
                        ret[k] = self(o[k])
                    }
                }
                return ret as any;
            },
        });
    }

    export function init(runner: RequestRunner): RequestProcessor<{}> {
        return wrap(() => Promise.resolve([{}, RequestTransform.identity()]), runner);
    }
}

