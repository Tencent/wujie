
import { getExcludes, isExcludeUrl } from "../../src/utils";

describe('utils test', () => {
  describe('getExcludes', () => {
    test('plugins is undefined, should return empty array', () => {
      expect(getExcludes('jsExcludes')).toEqual([]);
      expect(getExcludes('cssExcludes')).toEqual([]);
    })

    test('sourceType is "jsExcludes", should return jsExcludes', () => {
      const jsExcludes = ['https://www.foo/a.js', /b\.js/];
      const plugins = [
        {
          jsExcludes,
        }
      ]
      expect(getExcludes('jsExcludes', plugins)).toEqual(jsExcludes);
    });

    test('sourceType is "cssExcludes", should return cssExcludes', () => {
      const cssExcludes = ['https://www.foo/a.css', /b\.css/];
      const plugins = [
        {
          cssExcludes,
        }
      ]
      expect(getExcludes('cssExcludes', plugins)).toEqual(cssExcludes);
    });
  });
  describe('isExcludeUrl', () => {
    test('url is not exclude, should return false', () => {
      expect(isExcludeUrl('https://www.foo/a.js', ['https://www.foo/b.js'])).toBe(false);
    });
    test('url is exclude, should return true', () => {
      expect(isExcludeUrl('https://www.foo/a.js', ['https://www.foo/a.js'])).toBe(true);
    });
    test('url is match regexp, should return true', () => {
      expect(isExcludeUrl('https://www.foo/a.js', [/a\.js/])).toBe(true);
    })
   });
})
