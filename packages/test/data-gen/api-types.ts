import typia from "typia";
export interface User {
    name: string;
}
export interface Work {
    user?: User;
    id: number;
    others: User[];
}
export const assertUser = (input: any): User => {
    const __is = (input: any): input is User => {
        return "object" === typeof input && null !== input && "string" === typeof (input as any).name;
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is User => {
            const $guard = (typia.createAssert as any).guard;
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => "string" === typeof input.name || $guard(_exceptionable, {
                path: _path + ".name",
                expected: "string",
                value: input.name
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "User",
                value: input
            })) && $ao0(input, _path + "", true) || $guard(true, {
                path: _path + "",
                expected: "User",
                value: input
            });
        })(input, "$input", true);
    return input;
};
export const assertWork = (input: any): Work => {
    const __is = (input: any): input is Work => {
        const $io0 = (input: any): boolean => (undefined === input.user || "object" === typeof input.user && null !== input.user && $io1(input.user)) && "number" === typeof input.id && (Array.isArray(input.others) && input.others.every((elem: any) => "object" === typeof elem && null !== elem && $io1(elem)));
        const $io1 = (input: any): boolean => "string" === typeof input.name;
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is Work => {
            const $guard = (typia.createAssert as any).guard;
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => (undefined === input.user || ("object" === typeof input.user && null !== input.user || $guard(_exceptionable, {
                path: _path + ".user",
                expected: "(User | undefined)",
                value: input.user
            })) && $ao1(input.user, _path + ".user", true && _exceptionable) || $guard(_exceptionable, {
                path: _path + ".user",
                expected: "(User | undefined)",
                value: input.user
            })) && ("number" === typeof input.id || $guard(_exceptionable, {
                path: _path + ".id",
                expected: "number",
                value: input.id
            })) && ((Array.isArray(input.others) || $guard(_exceptionable, {
                path: _path + ".others",
                expected: "Array<User>",
                value: input.others
            })) && input.others.every((elem: any, _index1: number) => ("object" === typeof elem && null !== elem || $guard(_exceptionable, {
                path: _path + ".others[" + _index1 + "]",
                expected: "User",
                value: elem
            })) && $ao1(elem, _path + ".others[" + _index1 + "]", true && _exceptionable) || $guard(_exceptionable, {
                path: _path + ".others[" + _index1 + "]",
                expected: "User",
                value: elem
            })) || $guard(_exceptionable, {
                path: _path + ".others",
                expected: "Array<User>",
                value: input.others
            }));
            const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => "string" === typeof input.name || $guard(_exceptionable, {
                path: _path + ".name",
                expected: "string",
                value: input.name
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "Work",
                value: input
            })) && $ao0(input, _path + "", true) || $guard(true, {
                path: _path + "",
                expected: "Work",
                value: input
            });
        })(input, "$input", true);
    return input;
};
