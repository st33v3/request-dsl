import { RequestFactory } from "./factory";

export type RunArgs<A, B> = A extends never ? (B extends never ? [] : [body: B]) : (B extends never ? [args: A] : [args: A, body: B]);

export interface RequestProcessor {
    build<A, B, R>(req: RequestFactory<A, B, R>): (...args: RunArgs<A, B>) => Promise<R>,
}