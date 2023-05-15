export enum HttpMethod {
    Connect = 'CONNECT',
    Delete = 'DELETE',
    Get = 'GET',
    Head = 'HEAD',
    Options = 'OPTIONS',
    Patch = 'PATCH',
    Post = 'POST',
    Put = 'PUT',
    Trace = 'TRACE',
}


export function methodFromStringOpt(s: string): HttpMethod | undefined {
    if (s.length === 0) return undefined;
    const n = s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    const m = (HttpMethod as Record<string, unknown>)[n];
    return typeof m === "string" ? m as HttpMethod : undefined;
}

export function methodFromString(s: string): HttpMethod {
    const ret =  methodFromStringOpt(s);
    if (!ret) throw new Error("Not a HTTP method: " + s);
    return ret;
}

export function isValidHttpMethod(s: unknown): s is HttpMethod {
    if (typeof s !== "string") return false;
    return !!methodFromStringOpt(s);
}