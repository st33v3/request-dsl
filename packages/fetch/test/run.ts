import { RequestFactory } from "request-dsl";
import Address from "request-dsl/dist/address";
import { fetchProcessor } from "../src";
import { createServer } from "./test-server";


createServer("127.0.0.1", 3000);
const proc = fetchProcessor();
const init = RequestFactory.init();
const factory = init.apply(Address.url(new URL("http://127.0.0.1:3000/")))
const api = proc(factory);
await api().catch(err => console.error(err));
