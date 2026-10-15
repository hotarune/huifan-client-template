# 独立预约 Client 模板

Status: completed

Goal: 在会贩仓库外提供独立安装、构建、部署的本地商品预约模板。

User-visible invariant: JSON 是唯一商品来源；数量不受库存限制；二维码准确编码所有已选商品 ID 和数量；任何生成失败不清空购物车。

Invalidated assumptions: 不再需要用户身份、销售场次、在线目录、库存、订单、支付或服务端确认。预约码不保证预约已受理。

Impact map:
- Writer: 开发阶段 ZIP 导入器校验并替换 src/data，保留旧目录；业务运行期无持久化写入。
- Reader: 静态 JSON import + 图片 data URL；无在线查询、轮询、缓存副本或远程字体。
- Commands: 内存购物车增减；本地 QR 编码；关闭和重新生成不丢失选择。
- Recovery: 数据格式错误显示阻断页；导入失败保留原目录；二维码容量失败保留购物车。
- Boundary: 原仓库 apps/customer 与其他未提交改动保持原状；新目录无 workspace 依赖。

Scenario / requirement-to-verification:
- 空购物车：生成禁用；浏览器测试。
- 多商品增减、重新生成、关闭：浏览器测试并用 jsQR 独立解码。
- JSON/图片：构建验证与静态导入；ZIP 测试检查原图片字节保留、缺图拒绝。
- 非法路径、额外脚本、重复 ID、已有备份：ZIP 回归拒绝，原目录保持。
- 手机/宽桌面：390/1440/2560/3840 浏览器流程，布局宽度、JS 错误和网络请求断言。
- 搜索无匹配：浏览器检查，并清除过滤恢复。

Progress: 2026-10-15 创建 React/Vite 独立模板、本地 QR、静态目录、ZIP 导入器及 Agent README。

Verification: 详见 SUMMARY.md；二维码无库存和订单语义，刷新会清空内存购物车。未接入 service worker，不保证首次离线加载。

Next steps: 导入用户正式商品包后重新构建和验证。
