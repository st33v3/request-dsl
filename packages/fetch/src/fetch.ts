import { CodecData, RequestAddress, RequestData, RequestFactory, RequestProcessor, RunArgs } from "request-dsl";
import { ApiRequest, parseFunctionArgs } from "request-dsl";
import { DefaultBody } from "request-dsl/dist/codec";
import { FailureCause, RequestFailed } from "request-dsl/dist/failure";

async function* streamToIter(stream: ReadableStream<Uint8Array> | null): DefaultBody {
    //FIXME consider using BYOB reader?
    if (!stream) return;
    const reader = stream.getReader();
    try {
        while (true) {
            const result = await reader.read();
            if (result.done) return;
            else yield result.value;
        }
    } finally {
        reader.releaseLock();
    }
}

async function processData<B, R>(abort: AbortSignal | undefined, data: RequestData<B, R>, body: (() => any | PromiseLike<any>) | undefined): Promise<R> {
    const url = RequestAddress.toUrl(data.address);
    const init: RequestInit = {};
    init.method = data.method;
    init.headers = new Headers();
    for (const k in data.headers) {
        init.headers.set(k, data.headers[k]);
    }
    init.credentials = "include";
    init.signal = abort;
    init.redirect = "manual";
    if (body) {
        if (!data.encoder) throw new Error("Body is provided, but no encoder");
        const input: CodecData<B> = {
            status: 0,
            headers: data.headers,
            value: body,
            aux: undefined
        };
        const output = data.encoder(input);
        if (!output) throw new Error("Can not encode request body");
        if (output.outString) {
            init.body = await output.outString();
        } else {
            let iter: AsyncIterator<Uint8Array>;
            const stream = new ReadableStream({
                //type: "bytes", will lead to ReadableByteStreamController and its ReadableStreamBYOBRequest

                start(ctrl) {
                    return output.value().then(i => {iter = i[Symbol.asyncIterator]()});
                },
                pull(ctrl) {
                    iter.next().then(res => {if (res.done) ctrl.close(); else ctrl.enqueue(res.value);}, rej => ctrl.error(rej))
                }

            });
            if (abort) abort.addEventListener("abort", () => stream.cancel(), {once: true});
            init.body = stream;
        }
    }
    const response = await fetch(url, init);
    const headers: Record<string, string> = {};
    for (const e of response.headers.entries()) headers[e[0]] = e[1];
    const input: CodecData<DefaultBody> = {
        value: () => Promise.resolve(streamToIter(response.body)),
        inJson: () => response.json(),
        inString: () => response.text(),
        headers,
        status: response.status,
        aux: undefined,
    }
    const output = data.decoder(input);
    if (!output) throw new RequestFailed({kind: "rejected", status: response.status, headers })
    try {
        return await output.value();
    } catch (err) {
        if (err instanceof RequestFailed) throw err;
        throw new RequestFailed({kind: "invalid", status: response.status, headers: headers, error: err, aux: undefined});
    }
}

async function processLoop<B, R>(abort: AbortSignal | undefined, data: RequestData<B, R>, body: (() => any | PromiseLike<any>) | undefined): Promise<R> {
    let fail: FailureCause;
    try {
        return await processData(abort, data, body);
    } catch (err) {
        if (err instanceof RequestFailed) {
            fail = err.reason;
        } else {
            fail = {kind: "error", error: err}
        }
    }

}

export const fetchProcessor: RequestProcessor = <A, B, R>(req: RequestFactory<A, B, R>) => {
    function process(abort: AbortSignal | undefined, ...args: any[]): Promise<R> {
        const [as, body] = parseFunctionArgs(args);
        const data = req(as as any, new Map());
        return processData(abort, data, body);
    }
    function ret(...args:  any[]): Promise<R> {
        return process(undefined, ...args);
    }
    ret.withAbort = process;
    return ret;
}
