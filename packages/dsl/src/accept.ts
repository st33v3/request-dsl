import { BodyCodec, DefaultBody } from "./codec";
import { ResponseDecoder } from "./decoder";
import { isSpecial, matchStatus, SpecialStatusCode, StatusCodes } from "./status";
import { AltResultTransform, RequestTransform } from "./transform";

namespace Accept {

    /**
     * Throws away previous body decoders. 
     */
    export function reset<A extends {}, B>(): RequestTransform<A, B, any, A, B, never> {
        return factory => factory.pipeTo<never>(data => ({...data, decoder: ResponseDecoder.voidDecoder()}));
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

    function testContentType(ct: string, types: string[]): boolean {
        const pos = ct.indexOf(';');
        if (pos >= 0) ct = ct.substring(0, pos);
        ct = ct.trim().toLowerCase();
        return types.includes(ct);
    }

    function testContentTypes(types: string[], stat?: (code: number) => boolean): (code: number, headeds: Record<string, string>) => boolean {
        return (c, h) => (stat ? stat(c) : true) && testContentType(h["content-type"], types);
    }

    /**
     * Accepts body of any content type and handle the body as JSON object.
     * @param status HTTP Status
     * @param convert optional covertor/validator to application specific object
     * @returns Object parsed from HTTP body
     */
    export function acceptJsonLax<T = unknown>(status: StatusCodes, convert?: (json: unknown) => T): AltResultTransform<T> {
        const bd = BodyCodec.toJson();
        const bd2 = convert ? bd.map(convert) : bd as BodyCodec<DefaultBody, T>;
        return accept(bd2, testStatuses(status));
    }

    export function acceptJson<T = unknown>(status: StatusCodes, convert?: (json: unknown) => T): AltResultTransform<T> {
        const bd = BodyCodec.toJson();
        const bd2 = convert ? bd.map(convert) : bd as BodyCodec<DefaultBody, T>;
        return accept(bd2, testContentTypes(["application/json"],testStatuses(status)));
    }
    
    export function acceptDefault<T>(def: () => T | PromiseLike<T>, testAux?: (aux: unknown) => boolean): AltResultTransform<T> {
        const bc = BodyCodec.drainCodec().map(def);
        const decoder = ResponseDecoder.fromCodec(bc).when(ctx => ctx.status === SpecialStatusCode.useDefault && (!testAux ||testAux(ctx.aux)));
        return acceptDecoder(decoder);
    }

    export function accept<O>(d: BodyCodec<DefaultBody, O>, test?: (status: number, headers: Record<string, string>) => boolean): AltResultTransform<O> {
        const decoder = ResponseDecoder.fromCodec(d);
        const bd = test ? decoder.when(ctx => !isSpecial(ctx.status) && test(ctx.status, ctx.headers)) : decoder;
        return acceptDecoder(bd);
    }

    export function acceptOtherwise<O>(d: BodyCodec<DefaultBody, O>, test?: (status: number, headers: Record<string, string>) => boolean): AltResultTransform<O> {
        const decoder = ResponseDecoder.fromCodec(d);
        const bd = test ? decoder.when(ctx => !isSpecial(ctx.status) && test(ctx.status, ctx.headers)) : decoder;
        return factory => factory.pipeTo(data => ({...data, decoder: data.decoder.otherwise(decoder)}));
    }

    export function acceptDecoder<O>(decoder: ResponseDecoder<O>): AltResultTransform<O> {
        return factory => factory.pipeTo(data => ({...data, decoder: decoder.otherwise(data.decoder)}));
    }
}

export default Accept;

