import defaultPlugin, { getEffectLoaders, isMatchUrl } from "../../src/plugin";

describe("test getEffectLoaders", () => {
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

describe("test isMatchUrl", () => {
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

describe("test default cssLoader plugin", () => {
  const cssLoader = defaultPlugin.cssLoader;
  test("test relative code with src", () => {
    const relativeCode = "background-image: url('./test.gif');";
    const src = "https://test.com/base/home";
    const resultCode = cssLoader(relativeCode, src, "");
    expect(resultCode).toBe("background-image: url('https://test.com/base/test.gif');");
  });
  test("test relative code with base", () => {
    const relativeCode = "background-image: url('./test.gif');";
    const base = "https://test.com/base/home";
    const resultCode = cssLoader(relativeCode, "", base);
    expect(resultCode).toBe("background-image: url('https://test.com/base/test.gif');");
  });
  test("test relative code with src and base", () => {
    const relativeCode = "background-image: url('./test.gif');";
    const url = "./home/";
    const base = "https://test.com/base/";
    const resultCode = cssLoader(relativeCode, url, base);
    expect(resultCode).toBe("background-image: url('https://test.com/base/home/test.gif');");
  });
  test("test relative code with src and base", () => {
    const relativeCode = "background-image: url(./test.gif);";
    const url = "./home/";
    const base = "https://test.com/base/";
    const resultCode = cssLoader(relativeCode, url, base);
    expect(resultCode).toBe("background-image: url(https://test.com/base/home/test.gif);");
  });
  test("test base data code with src and base", () => {
    const relativeCode =
      "background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFIAAABSCAYAAADHLIObAAAAMUlEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3gxpYgAB841K1AAAAABJRU5ErkJggg==);";
    const url = "./home/";
    const base = "https://test.com/base/";
    const resultCode = cssLoader(relativeCode, url, base);
    expect(resultCode).toBe(relativeCode);
  });
});
