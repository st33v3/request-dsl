import fetch, { Headers as FHeaders, Request, Response } from "node-fetch";
import { BodyCodec, RequestFactory } from "request-dsl";
import Address from "request-dsl/address";
import { beforeAll, expect, test } from 'vitest';
import { fetchProcessor } from "../src";
import { createServer, testRequest } from "./test-server";
import { changeDecoder } from "request-dsl/src/request";
import { ResponseDecoder } from "request-dsl/src/decoder";

beforeAll(() => {

  // Asserts that fetch API is available.

  if (!globalThis.fetch) {
    globalThis.fetch = fetch as any;
    globalThis.Headers = FHeaders as any;
    globalThis.Request = Request as any;
    globalThis.Response = Response as any;
  }

  //Start devel server
  return createServer("127.0.0.1", 3000);
});

// Edit an assertion and save to see HMR in action

test('Make a request from factory', async () => {
  const proc = fetchProcessor();
  const init = RequestFactory.init();
  const factory = init
    .apply(Address.url(new URL("http://127.0.0.1:3000/")))
    .apply(changeDecoder(() => ResponseDecoder.fromCodec(BodyCodec.toString())))
  const api = proc(factory);
  const res = await api();
  expect(res).toSatisfy(s => typeof s === "string" && s.length > 0);
});

test('Make a HTTP request', async () => {
  const [status, headers, buff] = await testRequest("http://127.0.0.1:3000/");
  expect(status).toBe(200);
});
