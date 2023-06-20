import { RequestData } from "./factory";

export interface ErrorStrategy {
    kind: 'error',
    error: unknown
 }

export interface RetryStrategy {
    kind: 'retry',
    delay: (attempt: number) => number, //Delay in millis
    transform?: <R>(addr: RequestData<R>) => RequestData<R>,
}

export interface UseDefaultStrategy {
    kind: 'default',
    aux: unknown,
}

export type RecoverStrategy = ErrorStrategy | RetryStrategy | UseDefaultStrategy ;



export class RequestFailed extends Error {

    public constructor(public readonly cause: unknown, public readonly aux: unknown) {
        super("Request processing interrupted");
        if (this.constructor !== RequestFailed) throw new Error("Subclassing not allowed");
    }

    public static isFail(obj: unknown): obj is RequestFailed {
        return obj instanceof RequestFailed;
    }

    public static wrap(obj: unknown): RequestFailed {
        if (this.isFail(obj)) return obj;
        return new RequestFailed(obj, undefined);
    }
}
