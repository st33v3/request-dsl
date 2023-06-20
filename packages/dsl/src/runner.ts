import { BodyCodec, CodecData, DefaultBody } from "./codec";
import { ResponseContext } from "./decoder";
import { RequestContext, RequestData, RequestFactory } from "./factory";
import { RequestFailed } from "./failure";

/**
 * SPI interface that specifies capability of request making library. 
 */
export type RequestRunner = <A extends {}, B, R>(abort: AbortSignal | undefined, args: A, body: () => B | PromiseLike<B>, fac: RequestFactory<A, B, R>) => Promise<R>;

export interface ResponseData {
    status: number;
    headers: Record<string, string>;
    body: CodecData<DefaultBody>;
}

export type SingleRequest = (data: RequestData<unknown>, abort: AbortSignal | undefined) => Promise<ResponseData>;

export namespace RequestRunner {
    async function awt<B>(v: B | PromiseLike<B>) {
        return await v;
    }
    export function wrap(single: SingleRequest): RequestRunner {
        return <A extends {}, B, R>(abort: AbortSignal | undefined, args: A, body: () => B | PromiseLike<B>, fac: RequestFactory<A, B, R>) => {
            const ctx: RequestContext<A, B> = {
                args,
                body: () => awt(body()),
            };
            const data = fac(ctx);
            return processLoop(single, abort, data);
        };
    }

    async function processLoop<R>(single: SingleRequest, abort: AbortSignal | undefined, data: RequestData<R>): Promise<R> {
        let res: ResponseData | undefined = undefined;
        let recoverAux: unknown = undefined;
        let recoverStatus: number = 0;
        let recoverHeaders: Record<string, string> = {};
        let recoverBody = undefined;
        let finalErr: unknown = undefined;

        try {
            res = await single(data, abort);
            recoverHeaders = res.headers;
            recoverStatus = res.status;
        } catch (err) {
            recoverAux = err;
            finalErr = err;
        }
        try {
            if (res) {
                const rc: ResponseContext = {aux: undefined, status: res.status, headers: res.headers};
                const codec = data.decoder(rc);
                if (!codec) { //rejected
                    recoverBody = res.body;
                } else {
                    return await codec(res.body).value();
                }
            }
        } catch (err) {
            if (RequestFailed.isFail(err)) {
                recoverAux = err.aux;
                finalErr = err.cause;
            } else {
                finalErr = err;
            }
        }
        let rc: ResponseContext = {aux: recoverAux, status: recoverStatus, headers: recoverHeaders};
        const recover = data.recover(rc);
        if (!recover) throw finalErr;
        const strategy = await recover(recoverBody || BodyCodec.emptyBody()).value();
        console.log("Unimplemented", strategy);
        throw finalErr;
    }
}