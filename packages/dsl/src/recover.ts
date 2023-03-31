import { RecoverStrategy, RetryStrategy } from "./failure";
import { RequestTransform, SimpleRequestTransform2 } from "./transform";


/**
 * 
 * <li>Follow redirect
 * <li>Send authorization
 * <li>Send refresh token to acquire auth token
 * <li>Retry several times with pause (growing) in case of error or bad response (status code and/or content)
 * <li>Provide default value if retry fails?
 * 
 * Retry actions
 * <li>Restart request
 * <li>Modify request (headers, ...)
 */

// export function handleReject<A, B, R, A, B, R1>(codes: number[] | number | undefined, handler: (err: HttpError) => R): RequestTransform<A, B, R, A, B, R | R1> {
//     return factory => {
//         const match = codes === undefined || (typeof codes === "number" ? obj.status === codes : codes.includes(obj.status));
//         if (match) return handler(obj);
//     }
//     throw obj;
// }

export interface StrategyBuilder extends SimpleRequestTransform2 {
    retry(max: number, delay: number): StrategyBuilder;
    jitter(max: number): StrategyBuilder;
    exponentialDelay(base?: number): StrategyBuilder;
    fibonacciDelay(start?: number): StrategyBuilder;
    useDefault(): StrategyBuilder;
    error(error: unknown): StrategyBuilder;
    aux(value: unknown): StrategyBuilder;
}

interface StrategyMaterial {
    readonly strategy: RecoverStrategy["kind"]; 
    readonly retry: number;
    readonly aux?: unknown;
    readonly error: unknown;
    readonly delay: number;
    readonly jitter: number;
    readonly base: number | undefined;
    readonly fib: number | undefined;
}

const empty: StrategyMaterial = {
    strategy: "error",
    retry: 0,
    delay: 0,
    jitter: 0,
    base: undefined,
    fib: undefined,
    error: undefined,
};

function makeBuilder(material: StrategyMaterial): StrategyBuilder {
    
    function assert(s: RecoverStrategy["kind"]): true {
        if (material.strategy !== s) throw new Error("Use this builder method only for strategy " + s);
        return true;
    }

    const transform: SimpleRequestTransform2 = f => f;
    return Object.assign(transform, {
        retry: (retry: number, delay: number) => makeBuilder({...empty, strategy: "retry", retry, delay }),
        jitter: (jitter: number) => assert("retry") && makeBuilder({...material, jitter }),
        exponentialDelay: (base = 2) => assert("retry") && makeBuilder({...material, base }),
        fibonacciDelay: (fib = 0) =>  assert("retry") && makeBuilder({...material, fib }),
        error: (error: unknown) => makeBuilder({...empty, strategy: "error", error}),
        aux: (aux: unknown) => assert("fail") && makeBuilder({...material, aux}),
        useDefault: () => makeBuilder({...empty, strategy: "default"}),
    });
}

export function handleReject(): StrategyBuilder {
    fail();
}

function fail(): never {
    throw "Not implemented";
}

const Recover = {};
export default Recover;

