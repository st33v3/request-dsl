import express, { Response } from "express";
import http from "node:http";
import { User, assertUser } from "./data-gen/api-types";

function sendTexts(texts: string[], res: Response) {
    let i = 0;
    if (texts.length > 0) send(undefined);

    function send(err: any) {
        if (err) {
            console.error(err);
            return;
        }
        if (i < texts.length - 1) {
            res.write(texts[i++], "utf8", (err) => send(err));
        } else {
            res.end(texts[i], "utf8");
        }
    }
}
export function createServer(host: string, port: number): () => void {
    const app = express();
    app.use(express.json()) // for parsing application/json
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
    app.set("query parser", "simple");

    app.get("/", (req, res) => {
        // console.log(`\n${req.method} ${req.url}`);
        // console.log(req.headers);
        req.on("data", function (chunk) {
            //console.log("BODY: " + chunk);
        });
        res.status(200).send('Hello World!');
    });

    app.get("/chunked", (req, res) => {
        sendTexts(["asdasda", "asdasdasd", "asdadadd", "xx"], res.set("Content-Type", "text/plain").status(200));
    });

    app.get("/params/:param", (req, res) => {
        res.status(200).send('Param is: ' + req.params['param']);
    });

    app.get("/user", (req, res) => {
        const user: User = {
            name: "John"
        };
        res.set("Content-Type", "application/json").status(200).send(JSON.stringify(user));
    });

    app.post("/ping", (req, res) => {
        const body = req.body;
        res.set("Content-Type", "application/json").status(200).send(JSON.stringify(body));
    });

    const server = app.listen(port, host, () => {
        console.log(`Server running at http://${host}:${port}/`);
    });
    return () => server.close();
}

export function testRequest(addr: string): Promise<[number, http.IncomingHttpHeaders, string]> {
    return new Promise<[number, http.IncomingHttpHeaders, string]>((res, rej) => {
        const req = http.request(addr, r => {
            let buf = "";
            r.setEncoding("utf8");
            r.on('error', e => rej(e));
            r.on('data', d => buf += d);
            r.on('end', () => res([r.statusCode ?? 0, r.headers, buf]));
        });
        req.end();
    });
}

createServer("127.0.0.1", 3000);

testRequest("http://127.0.0.1:3000").then(res => console.log(res));
