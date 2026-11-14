/* eslint-disable */
// 将本地 node_modules/tinymce 的静态资源拷贝到 public/tinymce，
// 供 dev server / 构建产物以 /tinymce 路径静态托管。
// 这样 TinyMCE 可在运行时通过 base_url 用动态 <link> 加载 skin.min.css，
// 用于验证无界对“先 appendChild 再 setAttribute href”这类 link 的修复。
const fs = require("fs");
const path = require("path");

const force = process.argv.includes("--force");
const pkgRoot = path.dirname(require.resolve("tinymce/package.json"));
const dest = path.join(__dirname, "..", "public", "tinymce");
const flagFile = path.join(dest, "tinymce.min.js");

if (!force && fs.existsSync(flagFile)) {
  console.log("[copy-tinymce] public/tinymce 已存在，跳过拷贝（--force 可强制覆盖）。");
  process.exit(0);
}

console.log(`[copy-tinymce] 从 ${pkgRoot} 拷贝到 ${dest} ...`);
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(pkgRoot, dest, { recursive: true, dereference: true });
console.log("[copy-tinymce] 拷贝完成。");
