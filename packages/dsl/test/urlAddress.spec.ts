import { describe, expect, test } from 'vitest';
import Accept from '../src/accept';
import Address, { urlParams } from '../src/address';
import { RequestFactory } from "../src/factory";
import Headers, { contentType } from '../src/headers';
import { HttpMethod } from '../src/method-enum';
import { method } from '../src/request';
import { RequestAddress } from '../src/urlAddress';
import { emptyContext } from './contexts';

describe('Request address object', () => {

    test('should convert from URL', () => {
        const addr = RequestAddress.fromUrl(new URL("http://localhost:2000/hu/brt?prd=mrd"))
        expect(addr.hostname).toBe("localhost");
        expect(addr.port).toBe(2000);
        expect(addr.path).toStrictEqual(["hu", "brt"]);
        expect(addr.search).toBeTruthy();
        expect(addr.search.get("prd")).toBe("mrd");
    })

    test('should convert to URL', () => {
        const addr: RequestAddress = {
            hostname: "localhost",
            path: [],
            protocol: "https",
            search: new URLSearchParams({"a": "b"}),
            username: "",
            password: "",
        };
        const url = RequestAddress.toUrl(addr);
        expect(url).toBeTruthy();
        expect(url.hostname).toBe("localhost");
        expect(url.pathname).toBe("/");
    })
})

