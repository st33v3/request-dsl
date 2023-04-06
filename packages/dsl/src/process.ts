import { RequestFactory } from "./factory";

//https://github.com/microsoft/TypeScript/issues/31751
//never is an empty union, therefore conditional tries to distribute ((A | B) extends ... is converted to  A extends ... | B extends ...), need to use [never]

export type RunArgs<A, B> = [A] extends [never]
    ? ([B] extends [never]
        ? [signal?: AbortSignal]
        : [body: B, signal?: AbortSignal])
    : ([B] extends [never] 
        ? [args: A, signal?: AbortSignal]
        : [args: A, body: B, signal?: AbortSignal]);

export interface RequestProcessor {
    build<A, B, R>(req: RequestFactory<A, B, R>): (...args: RunArgs<A, B>) => Promise<R>,
}

type X1 = RunArgs<string, never>;
