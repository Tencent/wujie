// 测试页面加载生命周期，集成测试使用
document.addEventListener("DOMContentLoaded", () => {
  console.log("vue2 document DOMContentLoaded trigger");
});

window.addEventListener("DOMContentLoaded", () => {
  console.log("vue2 window DOMContentLoaded trigger");
});

document.onreadystatechange = function () {
  console.log("vue2 document onreadystatechange trigger");
};

document.addEventListener("readystatechange", () => {
  console.log("vue2 document readystatechange trigger");
});

window.onload = () => console.log("vue2 window onload trigger");

window.addEventListener("load", () => {
  console.log("vue2 window load trigger");
});
