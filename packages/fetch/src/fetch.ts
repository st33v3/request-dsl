import { CodecData, RequestAddress, RequestProcessor } from "request-dsl";
import { DefaultBody } from "request-dsl/dist/codec";
import { RequestRunner, SingleRequest } from "request-dsl/dist/runner";

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

//Exported because of tests
export const processData: SingleRequest = async (data, abort) => {
    console.log("Addr", data.address);
    const url = RequestAddress.toUrl(data.address);
    console.log("URL", url);
    const init: RequestInit = {};
    init.method = data.method;
    init.headers = new Headers();
    for (const k in data.headers) {
        init.headers.set(k, data.headers[k]);
    }
    init.credentials = "include";
    init.signal = abort;
    init.redirect = "manual";
    if (data.body) {
        const out = data.body;
        if (out.asString) {
            init.body = await out.asString();
        } else {
            let iter: AsyncIterator<Uint8Array>;
            const stream = new ReadableStream({
                //type: "bytes", will lead to ReadableByteStreamController and its ReadableStreamBYOBRequest

                start(ctrl) {
                    return out.value().then(i => {iter = i[Symbol.asyncIterator]()});
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
        asJson: () => response.json(),
        asString: () => response.text(),
    }
    return {
        body: input,
        headers: headers,
        status: response.status,
    };
}

export function fetchProcessor(): RequestProcessor<{}> {
    return RequestProcessor.init(RequestRunner.wrap(processData));
}

