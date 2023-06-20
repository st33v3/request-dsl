import { ApiRequest, RequestExecutor } from "./api-request";
import type { RequestFactory } from "./factory";
import { RequestRunner } from "./runner";
import { RequestTransform, SimpleRequestTransform2 } from "./transform";

/**
 * Type describing mapping from object of request factories to object of API calls.
 */
export type ApiRequestObj<P extends {}, O extends Record<string, RequestFactory<any, any, any>>> = {[K in keyof O]: O[K] extends RequestFactory<infer IA extends P, infer IB, infer IR> ? ProvidedApiRequest<IA, IB, IR, P> : never };

/**
 * Mapper of API request that are provided by particular arguments
 */
type ProvidedApiRequest<A extends P, B, R, P extends {}> = ApiRequest<Omit<A, keyof P>, B, R>;

/**
 * Contract of function that is capable to runa a particular request according to request factory.
 * The processor encapsulates underlying mechanism of making a request such as fetch or Axios.
 * The function may be composed using provided operators to add transformation or provide arguments 
 * to any factory it is applied on.
 * @type P - structure of parameters being provided by processor. Initial processor provides empty
 * object, derived processors may provide any any object. Provided arguments are "subtracted"
 * from factory arguments in declaration of API call. 
 */
export interface RequestProcessor<P extends {}> {
    /**
     * Main purpose of RequestProcessor is to transform request factories to fully functional
     * API calls (through mechanism encapsulated by the processor). 
     */
    <A extends P, B, R>(req: RequestFactory<A, B, R>): ProvidedApiRequest<A, B, R, P>;
    
    /**
     * Applies provided transformation on every request factory supplied to the processor. Adding
     * transformations is cummulative and order of their application is reverse order of prepending.
     * Transformation may depend on parameters provided by the processor.
     * @param t 
     */
    prepend(tr: (a: P) => SimpleRequestTransform2 | Promise<SimpleRequestTransform2>): RequestProcessor<P>;
    
    /**
     * Provides arguments to every API call created by the processor. Provided values are retrieved
     * lazily (and possibly asynchronously) every time API call is performed. This is extension
     * to RequestFactory mechanism of argument provisioning which has to be synchronous.
     * @param f function that provides arguments of given structure
     * @type P1 arguments structure provided in this step of composition. The structure is added to
     * structure already provided by processor the combinator is called on.
     */
    provide<P1 extends {}>(f: (a: P) => P1 | PromiseLike<P1>): RequestProcessor<P1>;
    
    /**
     * Utility method to convert object containing request factories to object containing API requests. Use
     * to prevent invoking request processor repeatedly.
     * @param o object containing request factories to be converted
     */
    processObject<O extends Record<string, RequestFactory<any, any, any>>>(o: O): ApiRequestObj<P, O>;
}

export namespace RequestProcessor {
    async function awt<P>(v: P | PromiseLike<P>): Promise<P> {
        return await v;
    }

    /**
     * Created instance of RequestProcessor from runner and configuration chain
     * @param provided chain function that computes resulting factory transformation and provided arguments
     * @param runner request runner
     * @returns RequestProcessor
     */
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

