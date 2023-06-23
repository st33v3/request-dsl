import fetch, { Headers as FHeaders, Request, Response } from "node-fetch";
import http from "node:http";
import { RequestFactory } from "request-dsl";
import { emptyContext } from "request-dsl/test/contexts";
import { beforeAll, expect, test } from 'vitest';
import { processData } from "../src/fetch";
import { createServer, testRequest } from "./test-server";

beforeAll(() => {

  // Asserts that fetch API is available.

  if (!globalThis.fetch) {
    globalThis.fetch = fetch as any;
    globalThis.Headers = FHeaders as any;
    globalThis.Request = Request as any;
    globalThis.Response = Response as any;
  }

  //Start devel server
  return createServer("127.0.0.1", 3045);
});

test('test data processing', async () => {
  const req = RequestFactory.init()(emptyContext);
  req.address = {
    protocol: "http",
    hostname: "127.0.0.1",
    port: 3045,
    password: "",
    username: "", 
    path: [],
    search: new URLSearchParams(),
  };
  const res = await processData(req, undefined);
  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toBe("text/plain");
  expect(res.body).toBeTruthy();
  expect(res.body.value).toBeTruthy();
  expect(res.body.asJson).toBeTruthy();
  expect(res.body.asString).toBeTruthy();
});

test('Make a HTTP request', async () => {
  const [status, headers, buff] = await testRequest("http://127.0.0.1:3045/");
  expect(status).toBe(200);
  expect(headers["content-type"]).toBe("text/plain");
  expect(parseInt(headers["content-length"] ?? "-1")).toBeGreaterThanOrEqual(0);
});
