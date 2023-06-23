import { describe, test } from 'vitest';
import Accept from '../src/accept';
import Address from '../src/address';
import { RequestFactory } from "../src/factory";
import Headers, { contentType } from '../src/headers';
import { HttpMethod } from '../src/method-enum';
import { method } from '../src/request';
import { RequestAddress } from '../src/urlAddress';

describe('Header transformers', () => {

    test('...', () => {
        const init = RequestFactory.init();
        init.apply(method(HttpMethod.Post))
        const r2 = init
            .apply(Headers.basicAuthorization("brt", "prd"))
            .apply(Address.hostname("www.example.com"))
            .apply(Address.parameter("brt", "prd"))
            .apply(Address.pathAppend("segment"));
        const r3 = r2.addArgs<{x: string}>();
        const r4 = r3.applyArgs(args => contentType(args.x));
        const r5 = r4.addArgs<{y: string}>().applyArgs(p => contentType(p.y, "utf-8"));
        const r6 = r5.provideArgs({x: "text/plain"});
        const r7 = r6.apply(Accept.acceptJson(200, json => "" + json));
        console.dir(r7({args: {y: "text/html"}, body: () => Promise.reject() }));
        console.log(RequestAddress.toUrl(r7({args: {y: "text/html"}, body: () => Promise.reject() }).address));
    })
})

