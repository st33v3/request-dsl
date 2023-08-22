import { BodyCodec, RequestFactory } from "request-dsl";
import { fetchProcessor } from "request-dsl-fetch";
import Accept from "request-dsl/dist/accept";
import Address from "request-dsl/dist/address";
import Body from "request-dsl/dist/body";
import {User, assertUser } from "./data-gen/api-types";
import { ResponseDecoder } from "request-dsl/dist/decoder";
import { changeDecoder, method } from "request-dsl/dist/request";
import { contentType } from "request-dsl/dist/headers";
import { DefaultBody } from "request-dsl/dist/codec";
import { HttpMethod } from "request-dsl/src/method-enum";

const proc = fetchProcessor();

const init1= RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000")))
    .apply(Accept.acceptString(200))

const init2 = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000/user")))
    .apply(Accept.acceptJson(200, assertUser))

const init3 = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000/user")))
    .apply(Accept.acceptJson(200, assertUser))
    .apply(Accept.acceptString(201))

async function* chunks(body: DefaultBody): DefaultBody {
    for await (const chunk of body) {
        console.log("Chunk!");
        yield chunk;
    }
}

const init4 = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000/chunked")))
    .apply(changeDecoder(() => ResponseDecoder.fromCodec(BodyCodec.fromFunction(chunks).via(BodyCodec.toString()))));

const init5 = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000/params")))
    .apply(Accept.acceptStringLax(200))
    .addArgs<{x: string}>()
    .applyArgs(args => Address.pathAppend(args.x))

const init = RequestFactory.init()
    .apply(method(HttpMethod.Post))
    .apply(Address.url(new URL("http://127.0.0.1:3000/ping")))
    .apply(Accept.acceptStringLax(200))
    .apply(Body.json<User>())


const api = proc(init);

const apiZip = api.zip(api.map(s => s + "huhuhe"));

async function run() {
    console.clear();
    try {
        //const res = await api();
        //const res = await api({x: "Zdar"});
        const res = await api(() => ({name: "Jack"}));
        //const res = await apiZip({x: "zdar"});
        console.log(res);
    } catch (err) {
        console.error(err);
    }
}

run();
