import typia from "typia";

export interface User {
    name: string;
}

export interface Work {
    user?: User;
    id: number;
    others: User[];
}

export const assertUser = typia.createAssert<User>();
export const assertWork = typia.createAssert<Work>();