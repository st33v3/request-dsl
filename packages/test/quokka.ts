import { RequestFactory, RequestTransform } from "request-dsl";
import { fetchProcessor } from "request-dsl-fetch";
import Address from "request-dsl/address";
import { method } from "request-dsl/request";
import { assertUser } from "./data-gen/api-types";
import Accept from "request-dsl/accept";
import { basicAuthorization } from "request-dsl/headers";
import { HttpMethod } from "request-dsl";

const proc = fetchProcessor();

const init = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000")))
    .apply(Accept.acceptStringLax(200))
 

const api = proc(init);
const apiZip = api.zip(api.map(s => s + "huhuhe"));

async function run() {
    console.clear();
    try {
        const res = await apiZip();
        console.log(res);
    } catch (err) {
        console.error(err);
    }
}

run();


const admin = (path: string) => RequestTransform.pipe(
    Address.url(new URL("http://127.0.0.1:3000")),
    basicAuthorization("user", "pwd"),
    Address.pathAppend(path)
);

const getRequestBase = RequestFactory.init().apply(method(HttpMethod.Get));

const requests = {
    adminData: getRequestBase.apply(admin("data")),
    adminData2: getRequestBase.apply(admin("data2")),
}

const client = proc.processObject(requests)
const a = client.adminData();
client.adminData2();

// --------------------------------------------------------------------------

        //const res = await api({x: "Zdar"});
        //const res = await api(() => ({name: "Jack"}));
        //const res = await apiZip({x: "zdar"});


const init2 = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000/user")))
    .apply(Accept.acceptJson(200, assertUser))

const init3 = RequestFactory.init()
    .apply(Address.url(new URL("http://127.0.0.1:3000/user")))
    .apply(Accept.acceptJson(200, assertUser))
    .apply(Accept.acceptString(201))

// async function* chunks(body: DefaultBody): DefaultBody {
//     for await (const chunk of body) {
//         console.log("Chunk!");
//         yield chunk;
//     }
// }

// const init4 = RequestFactory.init()
//     .apply(Address.url(new URL("http://127.0.0.1:3000/chunked")))
//     .apply(changeDecoder(() => ResponseDecoder.fromCodec(BodyCodec.fromFunction(chunks).via(BodyCodec.toString()))));

// const init5 = RequestFactory.init()
//     .apply(Address.url(new URL("http://127.0.0.1:3000/params")))
//     .apply(Accept.acceptStringLax(200))
//     .addArgs<{x: string}>()
//     .applyArgs(args => Address.pathAppend(args.x))

// const init6 = RequestFactory.init()
//     .apply(method(HttpMethod.Post))
//     .apply(Address.url(new URL("http://127.0.0.1:3000/ping")))
//     .apply(Accept.acceptStringLax(200))
//     .apply(Body.json<User>())


//     //const apiZip = api.zip(api.map(s => s + "huhuhe"));
