export interface RequestAddress {
    protocol: string;
    hostname: string;
    port?: number;
    username: string;
    password: string;
    path: string[];
    search: URLSearchParams;
}

export namespace RequestAddress {
    
    export function fromUrl(s: URL): RequestAddress {
        const ret: RequestAddress = {
            path: s.pathname.substring(1).split("/"),
            hostname: s.hostname,
            protocol: s.protocol.substring(0, s.protocol.length - 1),
            search: s.search ? new URLSearchParams(s.search.substring(1)) : new URLSearchParams(),
            username: s.username,
            password: s.password,
        };
        if (s.port) ret.port = parseInt(s.port);
        return ret;
    }

    export function toUrl(addr: RequestAddress): URL {
        if (!addr.hostname) throw new Error("Address hostname is missing");
        const up = addr.username ? addr.username + (addr.password ? ":" + addr.password : "") + "@" : "";
        const q = addr.search ? "?" + addr.search : "";
        const p = addr.port ? ":" + addr.port : "";
        const pn = addr.path.length ? "/" + addr.path.join("/") : "";
        return new URL(`${addr.protocol ?? "https"}://${up}${addr.hostname}${p}${pn}${q}`);
    }

}
