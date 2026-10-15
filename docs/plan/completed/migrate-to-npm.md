# 切换为 npm

Status: completed

Goal: 独立模板通过 Node.js 自带 npm 安装、构建、导入及测试。

Progress: 2026-10-16 移除 packageManager 的 pnpm 声明与 pnpm-lock.yaml，生成 package-lock.json。脚本、CLI 用法、测试及 README 改为 npm；导入参数使用 npm run import:data -- /path/catalog.zip。历史验收记录保持原样，当前指引以 README 和 SUMMARY 为准。

Verification:
- 原 pnpm node_modules 触发 npm 读取旧安装树的 matches 错误；移到项目外后，全新生成 npm 锁文件并 npm ci 成功，验证后清理旧安装目录。
- npm run build、npm test 通过（5 组 Node 导入测试）。
- 临时项目执行实际 npm run import:data -- 外部示例 ZIP 成功；4 个商品、全部图片字节及旧数据备份核对通过。真实商品目录未改动。
- 当前入口不再调用 pnpm，不引入 Python 或浏览器测试依赖。

Next steps: none.
