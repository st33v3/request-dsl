import {RequestFactory, RequestTransform, RequestAddress} from "request-dsl";
import Headers, { contentType } from "request-dsl/headers";
import Address from "request-dsl/address";
import Accept from "request-dsl/accept";

const r = RequestFactory.init();
const a = RequestTransform.pipe(contentType("text/plain", "utf-8"), Headers.genericHeader("Asd", "Bsd"));
const f1 = a(r);

const r2 = r
    .apply(Headers.basicAuthorization("brt", "prd"))
    .apply(Address.hostname("www.example.com"))
    .apply(Address.parameter("brt", "prd"))
    .apply(Address.pathAppend("segment"));
const r3 = r2.addArgs<{x: string}>();
const r4 = r3.applyArgs(p => contentType(p.x));
const r5 = r4.addArgs<{y: string}>().applyArgs(p => contentType(p.y, "utf-8"));
const r6 = r5.provideArgs({x: "text/plain"});
const r7 = r6.apply(Accept.acceptJson(200, json => "" + json));
console.dir(r7({y: "text/html"}, new Map()));
console.log(RequestAddress.toUrl(r7({y: "text/html"}, new Map()).address));