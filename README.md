# 会贩 Client 预约模板

从会贩顾客端提取的独立 React + TypeScript + Vite 模板。仅保留商品选购、购物车、生成预约码；无需原仓库、API、数据库、登录或支付服务。

```sh
pnpm install
pnpm dev          # http://localhost:6183
pnpm build
pnpm preview      # http://localhost:6184
pnpm test         # ZIP 导入回归（需要 Python 3）
```

使用 Node.js 22.12+（或 24/26）和 pnpm 11。不需要安装 Playwright 或浏览器测试依赖。生产部署只需发布 `dist/` 到静态服务器。

数据来源是 `src/data/catalog.json` 的静态 import。所有图片通过 Vite 内联为 data URL，二维码由本地依赖生成；没有 fetch、XHR、WebSocket、统计、远程字体或第三方二维码服务。浏览器仍需首次加载 HTML/JS/CSS 静态文件；这不等同于首次打开就能无网加载，本模板未配置 Service Worker。开发模式关闭 HMR，CSP 禁止 connect-src。

预约码内容严格为 `商品ID,数量;商品ID,数量`，例如 `1001,2;1003,1`，无尾部分号，按 JSON 商品顺序编码，只含正数量商品。它不是唯一凭证，不包含价格、支付、身份或签名，也不会提交订单或占用库存。数量不受库存限制，仅受 JavaScript 安全整数和二维码物理容量限制；超容量时显示错误并保留购物车。购物车保存在当前页面内存，刷新后清空；关闭二维码不清空购物车。

默认数据是带可见 `MOCK` 标记的模板示例。导入真实商品后设置 `template: false`。无图商品使用名称首字占位。

## 给 Agent：从 ZIP 导入数据

这是开发阶段的数据替换，不是面向顾客的上传入口。不要添加运行时接口、远程 URL、订单/支付/库存逻辑。

1. 读取本 README；确认用户给出的 ZIP 是目标商品数据包。不要执行 ZIP 内脚本。
2. ZIP 根目录必须直接包含 `catalog.json` 和 `images/`，不能再套一层文件夹。只接受 PNG/JPEG/WebP/GIF 图片，不接受 SVG、HTML、JS、符号链接和任意路径。图片引用大小写必须与文件一致。
3. 先检查当前 `src/data` 是否有用户改动。已有 `src/data.previous` 时先核对并保存该备份，不能盲目覆盖。
4. 在项目根目录运行 `pnpm import:data /绝对路径/商品包.zip`（需要 Python 3）。工具先验证整个包、重复 ID、价格、图片引用与安全路径，成功才替换 `src/data`，旧数据保存在 `src/data.previous`；校验失败不改现有目录。不要用未经校验的 `unzip` 覆盖源码。限制为解压后 200 MiB、10000 条目，是资源包保护阈值，不是库存或商品展示上限。
5. 核对导入商品数量、ID、分类、价格、图片与原数据；不得编造缺失字段或把示例当作真实商品。来源字段不同，应先在临时目录转换成下述格式，再打 ZIP 并导入。保留原始商品 ID；无法满足 ID 格式时向用户确认映射，不能静默改 ID。
6. 运行 `pnpm build` 和 `pnpm test`（Python 3 ZIP 导入回归，不需要浏览器）。再用 `pnpm dev` 在手机与桌面手动检查商品、图片、搜索、分类、购物车增减、预约码关闭/重新生成；扫描二维码，确认多商品文本准确，并检查没有业务/外部请求。自动测试仅覆盖 ZIP 导入，页面交互需要手动验证。
7. 核对后手动删除 `src/data.previous`，或移到项目外妥善保存；它不是运行时输入。交付商品数、验证结果与任何未验证项。改数据必须重新构建发布。

包结构：

```text
catalog.zip
├── catalog.json
└── images/
    └── tote.png
```

JSON 完整示例：

```json
{
  "title": "摊位商品预约",
  "notice": "请向现场工作人员出示预约码。",
  "template": false,
  "products": [
    {
      "id": "1001",
      "name": "帆布袋",
      "description": "原色棉布",
      "category": "生活周边",
      "price": 3500,
      "unit": "个",
      "image": "images/tote.png"
    }
  ]
}
```

所有字段必填。`id` 是唯一非空字符串，仅允许英文字母、数字、下划线、短横线，禁止逗号和分号；`price` 是非负整数，单位为分，允许免费商品；`image` 可以为 `null`。`products: []` 显示明确空状态。文本原样渲染，不解析 HTML。数组顺序也是展示和二维码编码顺序。图片文件名仅使用 ASCII 字母、数字、下划线、短横线、点及目录斜杠，不能引用外网或上级目录。

可在数据目录中打包：`python3 -m zipfile -c catalog.zip catalog.json images/`。

## 数据包存放约定

商品 ZIP 与配套打包源文件存放在仓库外，不作为模板源码提交。通过 `pnpm import:data /绝对路径/商品包.zip` 导入；导入后的 `src/data/` 是运行页面所需的静态数据。当前内置目录是带 `MOCK` 标记的已验证示例数据，可替换为正式商品。

导入测试在临时目录中自行创建 ZIP，不依赖仓库内或机器上的外部示例包。
