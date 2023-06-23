import { describe, expect, test } from 'vitest';
import { SetOrUpdate } from '../src/set-update';

describe("Set or Update", () => {

    test("should set", () => {
        expect(SetOrUpdate.process("a", "b")).toBe("b");
        expect(SetOrUpdate.process(undefined, "b")).toBe("b");
    });

    test("should modify", () => {
        const a: string = "a";
        expect(SetOrUpdate.process(a, a => a + "b")).toBe("ab");
        expect(SetOrUpdate.process(undefined as string | undefined, a => a + "b")).toBe("undefinedb");
    });

});