import { BodyCodec, DefaultBody } from "./codec";
import { isSpecial, matchStatus, SpecialStatusCode, StatusCodes } from "./status";
import { AltResultTransform, RequestTransform } from "./transform";

namespace Accept {

    /**
     * Throws away previous body decoders. 
     */
    export function reset<P, B>(): RequestTransform<P, B, any, P, B, never> {
        return factory => factory.pipeTo<B, never>(data => ({...data, decoder: BodyCodec.voidDecoder()}));
    }

    // export function map<P, B, R, R1>(mapper: (r: R) => PromiseLike<R1>): RequestTransform<P, B, R, P, B, R1> {
    //     return factory => factory.pipeTo(data => {
    //         return {
    //             ...data,
    //             accept: (status, headers) => data.accept(status, headers).then(r => mapper(r)),
    //         };
    //     });
    // }

    function testStatuses(status: StatusCodes): (code: number) => boolean {
        return code => matchStatus(code, status);
    }

    function testContentTypes(types: string[], stat?: (code: number) => boolean): (code: number, headeds: Record<string, string>) => boolean {
        return (c, h) => (stat ? stat(c) : true) && types.includes(h["content-type"]);
    }

    export function acceptJsonLax<P, B, R, T = unknown>(status: StatusCodes, convert?: (json: unknown) => T): RequestTransform<P, B, R, P, B, R | T> {
        const bd = BodyCodec.toJson();
        const bd2 = convert ? bd.map(convert) : bd as BodyCodec<DefaultBody, T>;
        return accept(bd2, testStatuses(status));
    }

    export function acceptJson<P, B, R, T = unknown>(status: StatusCodes, convert?: (json: unknown) => T): RequestTransform<P, B, R, P, B, R | T> {
        const bd = BodyCodec.toJson();
        const bd2 = convert ? bd.map(convert) : bd as BodyCodec<DefaultBody, T>;
        return accept(bd2, testContentTypes(["application/json"],testStatuses(status)));
    }
    
    export function acceptDefault<T>(def: () => T | PromiseLike<T>, testAux?: (aux: unknown) => boolean): AltResultTransform<T> {
        const bd = BodyCodec.drainCodec().map(def);
        const bd2 = testAux ? bd.when((s, h, a) => testAux(a)): bd;
        const bd3 = bd2.when((s) => s === SpecialStatusCode.useDefault);
        return accept(bd3);
    }

    export function accept<O>(d: BodyCodec<DefaultBody, O>, test?: (status: number, headers: Record<string, string>) => boolean): AltResultTransform<O> {
        const bd = test ? d.when((s, h) => !isSpecial(s) && test(s, h)) : d;
        return factory => factory.pipeTo(data => ({...data, decoder: bd.otherwise(data.decoder)}));
    }

    export function acceptOtherwise<O>(d: BodyCodec<DefaultBody, O>, test?: (status: number, headers: Record<string, string>) => boolean): AltResultTransform<O> {
        const bd = test ? d.when((s, h) => !isSpecial(s) && test(s, h)) : d;
        return factory => factory.pipeTo(data => ({...data, decoder: data.decoder.otherwise(bd)}));
    }
}

export default Accept;

