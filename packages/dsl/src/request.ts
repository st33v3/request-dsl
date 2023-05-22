import { ResponseDecoder } from "./decoder";
import { HttpMethod } from "./method-enum";
import { SetOrUpdate } from "./set-update";
import { MapResultTransform, RequestTransform, SimpleRequestTransform2 } from "./transform";

export function changeDecoder<R, T>(f: (decoder: ResponseDecoder<R>) => ResponseDecoder<T>): MapResultTransform<R, T> {
    return factory => factory.pipeTo(data => ({...data, decoder: f(data.decoder)}));
}

export function method(m: SetOrUpdate<HttpMethod>): SimpleRequestTransform2 {
    return factory => factory.pipeTo(data => ({...data, method: SetOrUpdate.process(data.method, m)}));
}

