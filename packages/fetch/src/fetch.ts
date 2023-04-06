import { RequestFactory, RequestProcessor, RunArgs } from "request-dsl";

export function fetchProcessor(): RequestProcessor {
    return {
        build<A, B, R>(req: RequestFactory<A, B, R>): (...args: RunArgs<A, B>) => Promise<R> {
            return (...a) => {
                throw new Error("Function not implemented.");
            };
        }
    }
}