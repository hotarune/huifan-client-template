# 示例商品 ZIP 与完整导入验证

Status: completed

Goal: 提供可用 JSON + 图片示例 ZIP，并通过真实导入、构建、商品展示和预约码生成流程。

Context: examples/catalog-example.zip；README 示例包说明；tests/reservation.spec.ts。

Progress: 2026-10-15 创建 4 个 MOCK 商品、2 个分类、4 张 320×320 PNG 插画，覆盖短横线/下划线/数字 ID、子目录图片及零价商品。实际通过 pnpm import:data 导入；核对包内所有文件与导入目录字节一致。导入前目录与前次 Git 提交逐字节比对一致后才清理备份，原数据仍可从 Git 恢复。

Verification:
- 生产构建与 TypeScript 检查通过。
- 5 个 Playwright 场景通过：390/1440/2560/3840 四种屏宽的全部商品数、名称、描述、价格、图片成功解码及 data URL、分类过滤、搜索、购物车增减、关闭和重新生成；另验证免费商品单独生成后减到零禁用按钮。
- jsQR 从实际页面二维码 PNG 解码得到 DEMO-1001,1;DEMO_1002,2；免费商品为 FREE-1004,1。
- 浏览器无业务/外部请求、页面脚本异常或水平溢出。测试允许内联 data:image URL，这是浏览器读取本地资源，不是网络请求。
- 2 个 Python 导入回归通过，含交付 ZIP 的逐文件一致性、PNG 签名、旧数据保留，以及不安全路径、脚本、缺图、重复 ID 和已有备份保护。
- 人工检查手机流程截图，四张插画展示正确。

Next steps: 无；可将示例 ZIP 交给 Agent 复用。正式数据替换仍需重新构建验证。
