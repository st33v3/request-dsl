import { RequestFactory } from "./factory";

export type RequestTransform<P1, B1, R1, P2, B2, R2> = (factory: RequestFactory<P1, B1, R1>) => RequestFactory<P2, B2, R2>;
export type SimpleRequestTransform<P, B, R> = RequestTransform<P, B, R, P, B, R>;

export type SimpleRequestTransform2 = <P, B, R>(factory: RequestFactory<P, B, R>) => RequestFactory<P, B, R>;
export type AltResultTransform<T> = <P, B, R>(factory: RequestFactory<P, B, R>) => RequestFactory<P, B, R | T>;
export type MapResultTransform<R, T> = <P, B>(factory: RequestFactory<P, B, R>) => RequestFactory<P, B, T>;

export namespace RequestTransform {
    export function pipe<P1, B1, R1, P2, B2, R2>(t1: RequestTransform<P1, B1, R1, P2, B2, R2>): RequestTransform<P1, B1, R1, P2, B2, R2>;
    export function pipe<P1, B1, R1, P2, B2, R2, P3, B3, R3>(t1: RequestTransform<P1, B1, R1, P2, B2, R2>, t2: RequestTransform<P2, B2, R2, P3, B3, R3>): RequestTransform<P1, B1, R1, P3, B3, R3>;
    export function pipe
        <
            P1, B1, R1,
            P2, B2, R2,
            P3, B3, R3,
            P4, B4, R4
        >(
            t1: RequestTransform<P1, B1, R1, P2, B2, R2>,
            t2: RequestTransform<P2, B2, R2, P3, B3, R3>,
            t3: RequestTransform<P3, B3, R3, P4, B4, R4>
        ): RequestTransform<P1, B1, R1, P4, B4, R4>;
    export function pipe
        <
            P1, B1, R1,
            P2, B2, R2,
            P3, B3, R3,
            P4, B4, R4,
            P5, B5, R5,
        >(
            t1: RequestTransform<P1, B1, R1, P2, B2, R2>,
            t2: RequestTransform<P2, B2, R2, P3, B3, R3>,
            t3: RequestTransform<P3, B3, R3, P4, B4, R4>,
            t4: RequestTransform<P4, B4, R4, P5, B5, R5>,
        ): RequestTransform<P1, B1, R1, P5, B5, R5>;
        export function pipe
        <
            P1, B1, R1,
            P2, B2, R2,
            P3, B3, R3,
            P4, B4, R4,
            P5, B5, R5,
            P6, B6, R6,
        >(
            t1: RequestTransform<P1, B1, R1, P2, B2, R2>,
            t2: RequestTransform<P2, B2, R2, P3, B3, R3>,
            t3: RequestTransform<P3, B3, R3, P4, B4, R4>,
            t4: RequestTransform<P4, B4, R4, P5, B5, R5>,
            t5: RequestTransform<P5, B5, R5, P6, B6, R6>,
        ): RequestTransform<P1, B1, R1, P6, B6, R6>;
    export function pipe(...ts: RequestTransform<any, any, any, any, any, any>[]): RequestTransform<any, any, any, any, any, any> {
        if (!ts.length) throw new Error("Empty transformer array");
        let ret: RequestTransform<any, any, any, any, any, any> = ts[0];
        for (let i = 1; i < ts.length; i++) {
            const prev = ret;
            ret = (p) => ts[i](prev(p));
        }
        return ret;
    }
}

