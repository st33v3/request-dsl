import { RequestData } from "./factory";

export type FailureCause =
 | {kind: 'error', error: unknown}
 | {kind: 'rejected', status: number, headers: Record<string, string>}
 | {kind: 'invalid', status: number, headers: Record<string, string>, error: unknown, aux: unknown}
 ;

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


function causeToMsg(cause: FailureCause): string {
    switch (cause.kind) {
        case 'error': 
            const err = (cause.error instanceof Error) ? cause.error.message : "" + cause.error;
            return 'Error during request: ' + err;
        case 'rejected': return 'Response not accepted. Status code = ' + cause.status;
        case 'invalid': return 'Invalid response. Status code = ' + cause.status;
    }
}

export class RequestFailed extends Error {

    public constructor(public readonly reason: FailureCause) {
        super(causeToMsg(reason));
        if (this.constructor !== RequestFailed) throw new Error("Subclassing not allowed");
    }

    public static isFail(obj: unknown): obj is RequestFailed {
        return obj instanceof RequestFailed;
    }

    public static wrap(obj: unknown): RequestFailed {
        if (this.isFail(obj)) return obj;
        return new RequestFailed({kind: 'error', error: obj});
    }
}
