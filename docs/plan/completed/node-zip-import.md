# Node.js ZIP 导入工具

Status: completed

Goal: 模板的安装、构建、ZIP 导入与自动测试均只依赖 Node.js/pnpm，不再要求额外语言运行环境。

Invariant: 完整校验后才替换 src/data；保留 src/data.previous；失败保留旧数据并清理暂存文件；商品 ID、JSON 值与图片字节不变。

Impact map: pnpm import:data -> Node CLI -> yauzl 顺序读取/路径和条目限制 -> CRC 校验 -> JSON/图片引用校验 -> 暂存目录 -> 备份及替换。pnpm test -> node:test 临时 ZIP 回归。浏览器运行代码不变。

Progress: 2026-10-16 删除旧导入脚本与测试，新增 scripts/import-data.mjs 和 tests/import-data.test.mjs。yauzl 用于限制解压大小、读取 ZIP 元数据及拒绝符号链接；crc-32 保留损坏检测；fflate 仅为测试构造 ZIP，均为开发依赖。README 和命令已更新。

Verification:
- pnpm install --frozen-lockfile、pnpm build、pnpm test 通过。
- 5 组 node:test 覆盖正常导入/子目录图片/原文件字节/旧数据备份、已有备份拒绝、缺图/非法路径/符号链接/重复路径/重复 ID/负数与小数价格/非法 ID/非 ZIP/CRC 损坏、空目录/无图、超过条目数和解压容量、CLI 用法。
- 在临时项目通过实际 pnpm import:data 导入仓库外示例 ZIP，4 个商品及全部图片字节一致，旧数据备份保留；真实项目数据未改动。
- 构建输出与工具迁移前一致；无页面行为变更，未运行浏览器测试。

Next steps: none.
