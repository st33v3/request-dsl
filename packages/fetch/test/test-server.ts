import http from "node:http";

export function createServer(host: string, port: number): () => void {
    const server = http.createServer((req, res) => {
        // console.log(`\n${req.method} ${req.url}`);
        // console.log(req.headers);

        req.on("data", function (chunk) {
            //console.log("BODY: " + chunk);
        });

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("Hello World\n");
    });

    server.listen(port, host, () => {
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