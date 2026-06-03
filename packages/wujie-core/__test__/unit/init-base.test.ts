import { initBase } from "../../src/iframe";

describe("initBase", () => {
  it("uses iframe location pathname by default", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const win = iframe.contentWindow as Window;
    win.document.open();
    win.document.write("<!DOCTYPE html><html><head></head><body></body></html>");
    win.document.close();

    initBase(win, "http://localhost:7600/app/");

    const base = win.document.head.querySelector("base");
    expect(base?.getAttribute("href")).toBe(`http://localhost:7600${win.location.pathname}`);
    document.body.removeChild(iframe);
  });

  it("uses explicit pathname for degrade render iframe", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const win = iframe.contentWindow as Window;
    win.document.open();
    win.document.write("<!DOCTYPE html><html><head></head><body></body></html>");
    win.document.close();

    initBase(win, "http://localhost:7600/", "/react16-sub/home");

    const base = win.document.head.querySelector("base");
    expect(base?.getAttribute("href")).toBe("http://localhost:7600/react16-sub/home");
    document.body.removeChild(iframe);
  });

  it("skips when head already has base", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const win = iframe.contentWindow as Window;
    win.document.open();
    win.document.write('<!DOCTYPE html><html><head><base href="http://existing/"></head><body></body></html>');
    win.document.close();

    initBase(win, "http://localhost:7600/", "/ignored");

    expect(win.document.head.querySelectorAll("base")).toHaveLength(1);
    expect(win.document.head.querySelector("base")?.getAttribute("href")).toBe("http://existing/");
    document.body.removeChild(iframe);
  });
});
