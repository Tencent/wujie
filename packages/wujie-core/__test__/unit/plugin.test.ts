import { getEffectLoaders, isMatchUrl } from "../../src/plugin";

describe("utils test", () => {
  describe("getEffectLoaders", () => {
    test("plugins is undefined, should return empty array", () => {
      expect(getEffectLoaders("jsExcludes", [])).toEqual([]);
      expect(getEffectLoaders("cssExcludes", [])).toEqual([]);
    });

    test('sourceType is "jsExcludes", should return jsExcludes', () => {
      const jsExcludes = ["https://www.foo/a.js", /b\.js/];
      const plugins = [
        {
          jsExcludes,
        },
      ];
      expect(getEffectLoaders("jsExcludes", plugins)).toEqual(jsExcludes);
    });

    test('sourceType is "cssExcludes", should return cssExcludes', () => {
      const cssExcludes = ["https://www.foo/a.css", /b\.css/];
      const plugins = [
        {
          cssExcludes,
        },
      ];
      expect(getEffectLoaders("cssExcludes", plugins)).toEqual(cssExcludes);
    });
  });
  describe("isMatchUrl", () => {
    test("url is not exclude, should return false", () => {
      expect(isMatchUrl("https://www.foo/a.js", ["https://www.foo/b.js"])).toBe(false);
    });
    test("url is exclude, should return true", () => {
      expect(isMatchUrl("https://www.foo/a.js", ["https://www.foo/a.js"])).toBe(true);
    });
    test("url is match regexp, should return true", () => {
      expect(isMatchUrl("https://www.foo/a.js", [/a\.js/])).toBe(true);
    });
  });
});
