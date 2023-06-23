import { describe, expect, test } from 'vitest';
import Accept from '../src/accept';
import Address from '../src/address';
import { RequestFactory } from "../src/factory";
import Headers, { contentType } from '../src/headers';
import { HttpMethod } from '../src/method-enum';
import { method } from '../src/request';
import { RequestAddress } from '../src/urlAddress';
import { emptyContext } from './contexts';

describe('Address transformers', () => {

    test('should set hostname', () => {
        const init = RequestFactory.init();
        const factory = init.apply(Address.hostname("127.0.0.1"));
        const data = factory(emptyContext);
        expect(data.address.hostname).toBe("127.0.0.1");
    })

    test('should set hostname and protocol from URL', () => {
        const init = RequestFactory.init();
        const factory = init.apply(Address.url(new URL("http://127.0.0.1")));
        const data = factory(emptyContext);
        expect(data.address.hostname).toBe("127.0.0.1");
        expect(data.address.protocol).toBe("http");
    })
})

