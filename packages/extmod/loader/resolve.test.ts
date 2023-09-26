import resolve from "./resolve";

describe("resolve", () => {
  describe("non-http specifiers", () => {
    it("should try to find bare specifier locally", async () => {
      const nextFn = jest.fn();

      await resolve("test", { conditions: [], importAssertions: {} }, nextFn);

      expect(nextFn).toBeCalled();
    });
  });
});
