/**
 * 单元测试：srcset 的候选之间可以用逗号分隔而不带空格。
 *
 * 按 HTML 规范 `srcset="a.png,b.png"` 是合法的两个候选；当前的扫描逻辑只在
 * 空白处切候选，于是整串被当成一个地址补全成 /app/a.png,b.png —— 两个候选全丢。
 */

export {};

import { getAbsoluteSrcset } from "../../src/utils";

const BASE = "https://sub.example.com/app/";

describe("getAbsoluteSrcset 的候选分隔", () => {
  it("逗号后没有空格时按两个候选处理", () => {
    expect(getAbsoluteSrcset("a.png,b.png", BASE)).toBe(
      "https://sub.example.com/app/a.png,https://sub.example.com/app/b.png"
    );
  });

  it("逗号后带空格时保持原有分隔格式", () => {
    expect(getAbsoluteSrcset("a.png, b.png", BASE)).toBe(
      "https://sub.example.com/app/a.png, https://sub.example.com/app/b.png"
    );
  });

  it("w 描述符与无空格逗号共存", () => {
    expect(getAbsoluteSrcset("a.png 640w,b.png 1280w", BASE)).toBe(
      "https://sub.example.com/app/a.png 640w,https://sub.example.com/app/b.png 1280w"
    );
  });

  it("1x 描述符与空格逗号共存", () => {
    expect(getAbsoluteSrcset("a.png 1x, b.png 2x", BASE)).toBe(
      "https://sub.example.com/app/a.png 1x, https://sub.example.com/app/b.png 2x"
    );
  });

  it("data url 内的逗号不拆", () => {
    expect(getAbsoluteSrcset("data:image/png;base64,AAA 1x, b.png 2x", BASE)).toBe(
      "data:image/png;base64,AAA 1x, https://sub.example.com/app/b.png 2x"
    );
  });

  it("末尾逗号原样保留", () => {
    expect(getAbsoluteSrcset("a.png,", BASE)).toBe("https://sub.example.com/app/a.png,");
  });
});
