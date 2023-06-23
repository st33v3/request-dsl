//Should not be used on functions (https://github.com/microsoft/TypeScript/issues/37663)
export type SetOrUpdate<T> = [T] extends [Function] ? never : T | ((value: T | undefined) => T);

export namespace SetOrUpdate {
    function tofun<T>(set: SetOrUpdate<T>): (value: T | undefined) => T {
        if (typeof set === "function") {
            return set as (value: T | undefined) => T;
        }
        return () => (set as T);
    }

    export function process<T>(value: T | undefined, mod: SetOrUpdate<T>): T {
        return tofun(mod)(value);
    }

    export function update<T>(value: () => T | undefined, mod: SetOrUpdate<T>): T {
        const s = tofun(mod);
        return s.length ? s(value()) : s(undefined);
    }

    export function convert<T, R>(setter: SetOrUpdate<T>, map: (t:T) => R, contramap: (r: R) => T | undefined): (r: R | undefined) => R {
        const s = tofun(setter);
        return (r: R | undefined) => {
            const t = s.length && r !== undefined ? contramap(r) : undefined;
            const nt = s(t);
            return map(nt);
        }
    }

    export function combine<A, B, R>(setterA: SetOrUpdate<A>, setterB: SetOrUpdate<B>, map: (a:A, b: B) => R, contramap: (r: R) => [A | undefined, B | undefined]): (r: R | undefined) => R {
        const as = tofun(setterA);
        const bs = tofun(setterB);
        return (r: R | undefined) => {
            const [a, b] = (as.length ||  bs.length) && r !== undefined ? contramap(r) : [undefined, undefined];
            const na = as(a);
            const nb = bs(b);
            return map(na, nb);
        }
    }

}


