import { CodecData, DefaultBody } from "./codec";
import { RequestTransform } from "./transform";
import { RecoverStrategy, RequestFailed } from "./failure";
import { HttpMethod } from "./method-enum";
import { RequestAddress } from "./urlAddress";
import { ResponseDecoder } from "./decoder";


export interface RequestData<R> {
    headers: Record<string, string>;
    body: CodecData<DefaultBody> | undefined;
    address: RequestAddress;
    decoder: ResponseDecoder<R>;
    recover: ResponseDecoder<RecoverStrategy>; //should return data for repeated request
    method: HttpMethod;
}

/**
 * Context for transforming arguments to RequestData. It is provided by processor when request 
 * is being made
 */
export interface RequestContext<A extends {}, B> {
    args: A;
    body: () => Promise<B>;
}
export interface RequestFactory<A extends {}, B, R> {
    (ctx: RequestContext<A, B>): RequestData<R>;
    /**
     * Tool to provide fluent API. Having transformers a and b, these call are equivalent: factory.apply(a).apply(b) and b(a(factory))
     */
    apply<A1 extends {}, B1, R1>(t: RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1>;
    addArgs<A1 extends {}>(): RequestFactory<A & A1 , B, R>;
    provideArgs<A1 extends Partial<A>>(provided: A1): RequestFactory<Omit<A, keyof A1> , B, R>;
    /**
     * Applies transformer created later from actual argument values
     * @param f funtion that provides factory transformer for particular arguments
     */
    applyArgs<A1 extends A, B1, R1>(f: (p: A) => RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1>;
    pipeTo<R1>(f: (d: RequestData<R>, ctx: RequestContext<A, B>) => RequestData<R1>): RequestFactory<A, B, R1>;
}

export namespace RequestFactory {
    export function init(): RequestFactory<{}, never, never> {
        return wrap(() => ({ 
            headers: {},
            address: {protocol: "https", path: [], search: new URLSearchParams(), username: "", password: "",  hostname: ""},
            decoder: ResponseDecoder.voidDecoder(),
            recover: ResponseDecoder.voidDecoder(),
            method: HttpMethod.Get,
            body: undefined,
         }));
    }

    export function wrap<A extends {}, B, R>(self: (ctx: RequestContext<A, B>) => RequestData<R>): RequestFactory<A, B, R> {
        const ret = self.bind({}); //Clone the function so later assign will not change the instance
        return Object.assign(ret, {
            apply<A1 extends {}, B1, R1>(t: RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1> {
                return t(ret as RequestFactory<A, B, R>);
            },
            addArgs<A1>(): RequestFactory<A & A1 , B, R> {
                return self as unknown as RequestFactory<A & A1 , B, R>;
            },
            provideArgs<A1 extends Partial<A>>(provided: A1): RequestFactory<Omit<A, keyof A1> , B, R> {
                return wrap<Omit<A, keyof A1>, B, R>((ctx) => self({...ctx, args: {...ctx.args, ...provided} as unknown as A}))
            },
            applyArgs<A1 extends A, B1, R1>(f: (p: A) => RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1> {
                return wrap((ctx) => {
                    const t = f(ctx.args);
                    return t(ret as RequestFactory<A, B, R>)(ctx);
                });
            },
            pipeTo<R1>(f1: (d: RequestData<R>, ctx: RequestContext<A, B>) => RequestData<R1>): RequestFactory<A, B, R1> {
                return wrap((ctx) => f1(self(ctx), ctx));
            },
        });
    }
}

type A = {a: string};
type B = A & void;
type C = A & unknown;
type D = void extends unknown ? true : false;
type E = [string | undefined] extends [undefined] ? true : false;

