# 移除模板 E2E 工具链

Status: completed

Goal: 安装和使用独立预约模板无需安装 Playwright 或测试浏览器。

Progress: 2026-10-16 移除 Playwright 配置、浏览器测试、Playwright/jsQR/pngjs 开发依赖；pnpm test 改为现有 Python ZIP 导入回归。README 改为构建、导入测试与手动页面验证，历史验收记录保留并明确为历史。

Verification: pnpm install、pnpm install --frozen-lockfile、pnpm build、pnpm test 均通过。配置/测试入口/锁文件中已无 Playwright；pngjs 5.0.0 是运行依赖 qrcode 的间接依赖，保留以避免影响二维码功能。清理本地旧浏览器报告，保留历史验收文档。本次仅更改测试工具链，未运行浏览器验证。

Next steps: none.
