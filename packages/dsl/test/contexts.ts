import { RequestContext } from "../dist/factory";

export const emptyContext: RequestContext<{}, never> = {
    args: {},
    body() { throw new Error('Body not available'); }
}

export function argsContext<A extends {}>(args: A): RequestContext<A, never> {
    return {
        args: args,
        body() { throw new Error('Body not available'); }
    }
}