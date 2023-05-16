import { RequestAddress } from "./urlAddress";
import { SetOrUpdate } from "./set-update";
import { SimpleRequestTransform2 } from "./transform";


export function url(set: SetOrUpdate<URL>): SimpleRequestTransform2 {
    return change(addr => RequestAddress.fromUrl(SetOrUpdate.update(() => RequestAddress.toUrl(addr), set)));
}

export function hostname(set: SetOrUpdate<string>): SimpleRequestTransform2 {
    return change(addr => ({...addr, hostname: SetOrUpdate.process(addr.hostname, set)}));
}

export function protocol(set: SetOrUpdate<string>): SimpleRequestTransform2 {
    return change(addr => ({...addr, protocol: SetOrUpdate.process(addr.protocol, set)}));
}

export function port(set: SetOrUpdate<number | undefined>): SimpleRequestTransform2 {
    return change(addr => ({...addr, port: SetOrUpdate.process<number | undefined>(addr.port, set)}));
}

export function path(set: SetOrUpdate<string[]>): SimpleRequestTransform2 {
    return change(addr => ({...addr, path: SetOrUpdate.process(addr.path, set)}));
}

export function pathAppend(set: string): SimpleRequestTransform2 {
    if (set.includes("/")) throw new Error("Path segment must not contain '/'");
    return change(addr => ({...addr, path: [...addr.path, set]}));
}

export function urlParams(set: SetOrUpdate<URLSearchParams>): SimpleRequestTransform2 {
    return change(addr => ({...addr, search: SetOrUpdate.process(addr.search, set)}));
}

export function parameter(param: string, set: SetOrUpdate<string | undefined>): SimpleRequestTransform2 {
    return urlParams(ps => {
        if (!ps) ps = new URLSearchParams();
        const np = SetOrUpdate.process<string | undefined>(ps.get(param) ?? undefined, set);
        if (np !== undefined) ps.set(param, np); else ps.delete(param);
        return ps;
    });
}


function change(f: (addr: RequestAddress) => RequestAddress): SimpleRequestTransform2 {
    return factory => factory.pipeTo(data => ({...data, address: f(data.address)}));
}

const address = { url, hostname, protocol, port, path, pathAppend, urlParams, parameter };

export default address; 
