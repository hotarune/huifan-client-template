// Procedural sample illustrations; no remote assets or generation service required.
import { PNG } from "pngjs";
import { mkdirSync, writeFileSync } from "node:fs";
const dir = new URL("../examples/catalog/", import.meta.url);
mkdirSync(new URL("images/paper/", dir), { recursive: true });
function illustration(background, draw) {
  const png = new PNG({ width: 320, height: 320 });
  const rect = (x, y, w, h, color) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        const offset = (j * 320 + i) * 4;
        png.data.set([...color, 255], offset);
      }
  };
  const circle = (x, y, radius, color) => {
    for (let j = y - radius; j <= y + radius; j++)
      for (let i = x - radius; i <= x + radius; i++) {
        if ((i - x) ** 2 + (j - y) ** 2 <= radius ** 2)
          png.data.set([...color, 255], (j * 320 + i) * 4);
      }
  };
  rect(0, 0, 320, 320, background);
  draw(rect, circle);
  return PNG.sync.write(png);
}
const assets = {
  "images/tote.png": illustration([245, 235, 219], (rect) => {
    rect(110, 60, 100, 100, [166, 121, 83]);
    rect(124, 74, 72, 84, [245, 235, 219]);
    rect(73, 117, 174, 150, [210, 177, 133]);
    rect(89, 130, 142, 123, [230, 204, 166]);
    rect(133, 167, 54, 48, [188, 112, 63]);
  }),
  "images/paper/postcard.png": illustration([226, 238, 233], (rect, circle) => {
    rect(54, 71, 212, 178, [255, 253, 245]);
    rect(67, 85, 186, 150, [196, 220, 207]);
    circle(203, 125, 22, [243, 187, 99]);
    rect(67, 196, 186, 39, [110, 160, 139]);
    rect(67, 218, 186, 17, [74, 131, 112]);
  }),
  "images/badge.png": illustration([234, 229, 243], (_, circle) => {
    circle(160, 163, 103, [181, 165, 204]);
    circle(160, 156, 98, [251, 248, 255]);
    circle(160, 156, 80, [215, 196, 234]);
    circle(132, 144, 9, [106, 78, 137]);
    circle(188, 144, 9, [106, 78, 137]);
    circle(160, 180, 15, [241, 153, 151]);
  }),
  "images/sticker.png": illustration([252, 237, 213], (rect, circle) => {
    rect(80, 58, 160, 204, [255, 253, 248]);
    circle(160, 137, 48, [236, 160, 83]);
    circle(145, 128, 5, [121, 79, 45]);
    circle(176, 128, 5, [121, 79, 45]);
    rect(139, 155, 43, 5, [121, 79, 45]);
    rect(111, 207, 98, 7, [226, 211, 187]);
  }),
};
const catalog = {
  title: "周末小铺 · 预约示例",
  notice: "MOCK 示例商品，请勿用于真实预约。",
  template: true,
  products: [
    {
      id: "DEMO-1001",
      name: "日常帆布袋",
      description: "棉布材质 · 原色",
      category: "生活周边",
      price: 3500,
      unit: "个",
      image: "images/tote.png",
    },
    {
      id: "DEMO_1002",
      name: "山间明信片",
      description: "风景插画 · 单张",
      category: "纸品",
      price: 1200,
      unit: "张",
      image: "images/paper/postcard.png",
    },
    {
      id: "1003",
      name: "微笑徽章",
      description: "圆形徽章 · 紫色",
      category: "生活周边",
      price: 1500,
      unit: "枚",
      image: "images/badge.png",
    },
    {
      id: "FREE-1004",
      name: "微笑贴纸",
      description: "免费领取的示例商品",
      category: "纸品",
      price: 0,
      unit: "张",
      image: "images/sticker.png",
    },
  ],
};
writeFileSync(
  new URL("catalog.json", dir),
  JSON.stringify(catalog, null, 2) + "\n",
);
for (const [path, bytes] of Object.entries(assets))
  writeFileSync(new URL(path, dir), bytes);
