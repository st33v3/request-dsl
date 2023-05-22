import { RequestFactory } from "./factory";

export type RequestTransform<A1 extends {}, B1, R1, A2 extends {}, B2, R2> = (factory: RequestFactory<A1, B1, R1>) => RequestFactory<A2, B2, R2>;
export type SimpleRequestTransform<A extends {}, B, R> = RequestTransform<A, B, R, A, B, R>;

export type SimpleRequestTransform2 = <A extends {}, B, R>(factory: RequestFactory<A, B, R>) => RequestFactory<A, B, R>;
export type AltResultTransform<T> = <A extends {}, B, R>(factory: RequestFactory<A, B, R>) => RequestFactory<A, B, R | T>;
export type MapResultTransform<R, T> = <A extends {}, B>(factory: RequestFactory<A, B, R>) => RequestFactory<A, B, T>;
export type SetBodyTransform<B> = <A extends {}, B1, R>(factory: RequestFactory<A, B1, R>) => RequestFactory<A, B, R>;

export namespace RequestTransform {
    export function pipe<A1 extends {}, B1, R1, A2 extends {}, B2, R2>(t1: RequestTransform<A1, B1, R1, A2, B2, R2>): RequestTransform<A1, B1, R1, A2, B2, R2>;
    export function pipe<A1 extends {}, B1, R1, A2 extends {}, B2, R2, A3 extends {}, B3, R3>(t1: RequestTransform<A1, B1, R1, A2, B2, R2>, t2: RequestTransform<A2, B2, R2, A3, B3, R3>): RequestTransform<A1, B1, R1, A3, B3, R3>;
    export function pipe
        <
            A1 extends {}, B1, R1,
            A2 extends {}, B2, R2,
            A3 extends {}, B3, R3,
            A4 extends {}, B4, R4
        >(
            t1: RequestTransform<A1, B1, R1, A2, B2, R2>,
            t2: RequestTransform<A2, B2, R2, A3, B3, R3>,
            t3: RequestTransform<A3, B3, R3, A4, B4, R4>
        ): RequestTransform<A1, B1, R1, A4, B4, R4>;
    export function pipe
        <
            A1 extends {}, B1, R1,
            A2 extends {}, B2, R2,
            A3 extends {}, B3, R3,
            A4 extends {}, B4, R4,
            A5 extends {}, B5, R5,
        >(
            t1: RequestTransform<A1, B1, R1, A2, B2, R2>,
            t2: RequestTransform<A2, B2, R2, A3, B3, R3>,
            t3: RequestTransform<A3, B3, R3, A4, B4, R4>,
            t4: RequestTransform<A4, B4, R4, A5, B5, R5>,
        ): RequestTransform<A1, B1, R1, A5, B5, R5>;
        export function pipe
        <
            A1 extends {}, B1, R1,
            A2 extends {}, B2, R2,
            A3 extends {}, B3, R3,
            A4 extends {}, B4, R4,
            A5 extends {}, B5, R5,
            A6 extends {}, B6, R6,
        >(
            t1: RequestTransform<A1, B1, R1, A2, B2, R2>,
            t2: RequestTransform<A2, B2, R2, A3, B3, R3>,
            t3: RequestTransform<A3, B3, R3, A4, B4, R4>,
            t4: RequestTransform<A4, B4, R4, A5, B5, R5>,
            t5: RequestTransform<A5, B5, R5, A6, B6, R6>,
        ): RequestTransform<A1, B1, R1, A6, B6, R6>;
    export function pipe(...ts: RequestTransform<any, any, any, any, any, any>[]): RequestTransform<any, any, any, any, any, any> {
        if (!ts.length) throw new Error("Empty transformer array");
        let ret: RequestTransform<any, any, any, any, any, any> = ts[0];
        for (let i = 1; i < ts.length; i++) {
            const prev = ret;
            ret = (p) => ts[i](prev(p));
        }
        return ret;
    }

    export function identity(): SimpleRequestTransform2 {
        return factory => factory;
    }
}
