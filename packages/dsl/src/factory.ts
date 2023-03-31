import { BodyCodec, DefaultBody } from "./codec";
import { RequestTransform } from "./transform";
import { RecoverStrategy, RequestFailed } from "./failure";

export interface RequestAddress {
    protocol: string;
    hostname: string;
    port?: number;
    username: string;
    password: string;
    path: string[];
    search: URLSearchParams;
}

export namespace RequestAddress {
    
    export function fromUrl(s: URL): RequestAddress {
        const ret: RequestAddress = {
            path: s.pathname.substring(1).split("/"),
            hostname: s.hostname,
            protocol: s.protocol.substring(1),
            search: s.search ? new URLSearchParams(s.search.substring(1)) : new URLSearchParams(),
            username: s.username,
            password: s.password,
        };
        if (s.port) ret.port = parseInt(s.port);
        return ret;
    }

    export function toUrl(addr: RequestAddress): URL {
        if (!addr.hostname) throw new Error("Address hostname is missing");
        const up = addr.username ? addr.username + (addr.password ? ":" + addr.password : "") + "@" : "";
        const q = addr.search ? "?" + addr.search : "";
        const p = addr.port ? ":" + addr.port : "";
        const pn = addr.path.length ? "/" + addr.path.join("/") : "";
        return new URL(`${addr.protocol ?? "https"}://${up}${addr.hostname}${p}${pn}${q}`);
    }

}

export interface RequestData<B, R> {
    headers: Record<string, string>;
    encoder?: BodyCodec<B, DefaultBody>;
    address: RequestAddress;
    decoder: BodyCodec<DefaultBody, R>;
    recover: BodyCodec<DefaultBody, RecoverStrategy>; //should return data for repeated request
}

export interface RequestFactory<A, B, R> {
    (args: A, ctx: Map<any, unknown>): RequestData<B, R>;
    /**
     * Tool to provide fluent API. Having transformers a and b, these call are equivalent factory.apply(a).apply(b) and b(a(factory))
     */
    apply<A1, B1, R1>(t: RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1>;
    addArgs<A1>(): RequestFactory<A & A1 , B, R>;
    provideArgs<A1 extends Partial<A>>(provided: A1): RequestFactory<Omit<A, keyof A1> , B, R>;
    /**
     * Applies transformer created later from actual argument values
     * @param f funtion that provides factory transformer for particular arguments
     */
    applyArgs<A1 extends A, B1, R1>(f: (p: A) => RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1>;
    pipeTo<B1, R1>(f: (d: RequestData<B, R>, ctx: Map<any, unknown>) => RequestData<B1, R1>): RequestFactory<A, B1, R1>
}

export namespace RequestFactory {
    export function init(): RequestFactory<unknown, never, never> {
        return wrap(() => ({ 
            headers: {},
            address: {protocol: "https", path: [], search: new URLSearchParams(), username: "", password: "",  hostname: ""},
            decoder: BodyCodec.voidDecoder(),
            recover: BodyCodec.voidDecoder(),
         }));
    }

    function wrap<A, B, R>(f: (args: A, ctx: Map<any, unknown>) => RequestData<B, R>): RequestFactory<A, B, R> {
        const self = f as RequestFactory<A, B, R>;
        return Object.assign(f, {
            apply<A1, B1, R1>(t: RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1> {
                return t(self);
            },
            addArgs<A1>(): RequestFactory<A & A1 , B, R> {
                return self as unknown as RequestFactory<A & A1 , B, R>;
            },
            provideArgs<A1 extends Partial<A>>(provided: A1): RequestFactory<Omit<A, keyof A1> , B, R> {
                return wrap<Omit<A, keyof A1>, B, R>((args, ctx) => f({...args, ...provided} as unknown as A, ctx))
            },

            applyArgs<A1 extends A, B1, R1>(f: (p: A) => RequestTransform<A, B, R, A1, B1, R1>): RequestFactory<A1, B1, R1> {
                return wrap((args, ctx) => {
                    const t = f(args);
                    return t(self)(args, ctx);
                });
            },
            pipeTo<B1, R1>(f1: (d: RequestData<B, R>, ctx: Map<any, unknown>) => RequestData<B1, R1>): RequestFactory<A, B1, R1> {
                return wrap((args, ctx) => f1(self(args, ctx), ctx));
            },
        });
    }
}