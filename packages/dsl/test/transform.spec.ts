import { describe, expect, test } from 'vitest';
import { RequestContext, RequestFactory } from "../src/factory";
import Headers, { contentType } from '../src/headers';
import { RequestTransform } from '../src/transform';
import { emptyContext } from './contexts';

describe('Request transformer', () => {

    test('should pipe', () => {
    
        const init = RequestFactory.init();
        const transform = RequestTransform.pipe(contentType("text/plain", "utf-8"), Headers.genericHeader("Asd", "Bsd"));
        const factory = transform(init);
        const data = factory(emptyContext);
        expect(data.headers).toBeTruthy;
        expect(data.headers['content-type']).toBe("text/plain; charset=utf-8");
        expect(data.headers['asd']).toBe("Bsd");
    });
})

