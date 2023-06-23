import { describe, expect, test } from 'vitest';
import Accept from '../src/accept';
import Address from '../src/address';
import { RequestFactory } from "../src/factory";
import Headers, { contentType } from '../src/headers';
import { HttpMethod } from '../src/method-enum';
import { method } from '../src/request';
import { RequestAddress } from '../src/urlAddress';
import { argsContext, emptyContext } from './contexts';

describe('Request factory', () => {

    test('should create empty data', () => {
    
        const init = RequestFactory.init();
        const data = init(emptyContext);
        expect(data.headers).toStrictEqual({});
        expect(data.body).toBeUndefined;
        expect(data.method).toBe(HttpMethod.Get);
    });

    test('should configure method', () => {
        const init = RequestFactory.init();
        const factory = init.apply(method(HttpMethod.Post))
        const data = factory(emptyContext);
        expect(data.method).toBe(HttpMethod.Post);
    })

    test('should modify method', () => {
        const init = RequestFactory.init();
        const factory = init
            .apply(method(HttpMethod.Post))
            .apply(method((m: HttpMethod | undefined) => m === HttpMethod.Post ? HttpMethod.Connect : HttpMethod.Delete))
        const data = factory(emptyContext);
        expect(data.method).toBe(HttpMethod.Connect);
    })

    test('should apply args', () => {
        const init = RequestFactory.init();
        const factory = init
            .addArgs<{x: HttpMethod}>()
            .applyArgs(args => method(args.x));
        const data = factory(argsContext({x: HttpMethod.Options}));
        expect(data.method).toBe(HttpMethod.Options);
    })

    test('should provide args', () => {
        const init = RequestFactory.init();
        const factory = init
            .addArgs<{x: HttpMethod}>()
            .applyArgs(args => method(args.x))
            .provideArgs({x: HttpMethod.Options});
        const data = factory(emptyContext);
        expect(data.method).toBe(HttpMethod.Options);
    })

    test('should provide args partially', () => {
        const init = RequestFactory.init();
        const factory = init
            .addArgs<{x: HttpMethod, y: string}>()
            .applyArgs(args => method(args.x))
            .provideArgs({x: HttpMethod.Options});
        const data = factory(argsContext({y: "s"}));
        expect(data.method).toBe(HttpMethod.Options);
    })

})

