import { SetOrUpdate } from "./set-update";
import { SimpleRequestTransform2 } from "./transform";

const ctrx = /(.+);\s*[cC]harset\s=\s(.+)/;
function parseContentType(contentType: string): [string, string | undefined] {
    const res = contentType.match(ctrx);
    if (res) {
        return [res[1], res[2]];
    }
    return [contentType, undefined];
}

export function contentType(mime: SetOrUpdate<string>, enc?: SetOrUpdate<string>): SimpleRequestTransform2 {
    if (enc === undefined) {
        return genericHeader("Content-Type", mime);
    }
    return genericHeader("Content-Type", SetOrUpdate.combine(mime, enc, (m, e) => e ? `${m}; charset=${e}` : m, parseContentType));
}

function stripBasic(s: string): string {
    if (!s.trim().toLowerCase().startsWith("basic ")) throw new Error("Not a basic authorization: " + s);
    return s.trim().substring(5).trim();
}

export function basicAuthorization(user: SetOrUpdate<string>, password: SetOrUpdate<string>): SimpleRequestTransform2 {
    function decode(s: string): [string, string] {
        const d = atob(stripBasic(s));
        const p = d.indexOf(":");
        if (p < 0 || d.indexOf(":", p + 1) >= 0) throw new Error("Either not basic auth credentials, or user/password contains ':'");
        return [d.substring(0, p), d.substring(p + 1)];
    }
    return authorization(SetOrUpdate.combine(user, password, (u, p) => "Basic " + btoa(`${u}:${p}`), decode));
}

export function basicAuthorizationStr(value: SetOrUpdate<string>): SimpleRequestTransform2 {
    return authorization(SetOrUpdate.convert(value, s => "Basic " + s, s => stripBasic(s)));
}

export function authorization(value: SetOrUpdate<string>): SimpleRequestTransform2 {
    return genericHeader("Authorization", value);
}

export function genericHeader(header: string, value: SetOrUpdate<string>): SimpleRequestTransform2 {
    header = header.toLowerCase();
    return factory => factory.pipeTo(data => {
        const prev = data.headers[header];
        const ret = {
            ...data,
            headers: {...data.headers, [header]: SetOrUpdate.process(prev, value)}
        };
        return ret;
    });
}

const all = { authorization, basicAuthorization, basicAuthorizationStr, contentType, genericHeader };

export {all as default};
