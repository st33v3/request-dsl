import fetch, { Headers as FHeaders, Request, Response } from "node-fetch";
import http from "node:http";
import { RequestAddress, RequestFactory, RequestTransform } from "request-dsl";
import { fetchProcessor } from "request-dsl-fetch";
import Accept from "request-dsl/accept";
import Address from "request-dsl/address";
import Headers, { contentType } from "request-dsl/headers";
import { beforeAll, test } from 'vitest';

beforeAll(() => {

  // Asserts that fetch API is available.

  if (!globalThis.fetch) {
    globalThis.fetch = fetch as any;
    globalThis.Headers = FHeaders as any;
    globalThis.Request = Request as any;
    globalThis.Response = Response as any;
  }

  //Start devel server
  
  const hostname = "127.0.0.1";
  const port = 3000;

  const server = http.createServer((req, res) => {
    console.log(`\n${req.method} ${req.url}`);
    console.log(req.headers);

    req.on("data", function(chunk) {
      console.log("BODY: " + chunk);
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World\n");
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
  return () => server.close();
});

// Edit an assertion and save to see HMR in action

const proc = fetchProcessor();

test('Create request factor', () => {
  
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
  console.dir(r7({args: {y: "text/html"}, body: () => Promise.reject() }));
  console.log(RequestAddress.toUrl(r7({args: {y: "text/html"}, body: () => Promise.reject() }).address));
  const api = proc(r7);
  
})

test('Make a HTTP request', async () => {
  const response = new Promise((res, rej) => {
    const req = http.request("http://localhost:3000/", r => {
      let buf = "";
      r.setEncoding("utf8");
      console.log("SC: " + r.statusCode);
      console.log("CT: " + r.headers["content-type"]);
      console.log("CL: " + r.headers["content-length"]);
      r.on('error', e => rej(e));
      r.on('data', d => buf += d);
      r.on('end', () => res(buf));
    });
    req.end();  
  });
  await response;
});
