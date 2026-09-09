# LX Music Sync Server Fork

LX Music 私有数据同步服务的本地二开仓，支持列表、dislike、statistics 同步与快照，并提供兼容客户端使用的只读列表导出接口。版本、脚本和协议以 `package.json`、`src/` 与 tests 为准。

本机家族入口：`D:\ClaudeSpace\Project\lx-music\docx\README.md`。`gitea` 保存当前 fork，`deploy` 是既有部署分支，`origin` 仅作上游基线。服务端协议变更必须同步核对 Desktop、Mobile、Mineradio 和 Mineradio Mobile。

## 开发与验证

需要 Node.js 16+ 和 npm：

```powershell
npm.cmd ci
npm.cmd run dev
```

构建并运行生产入口：

```powershell
npm.cmd run build
npm.cmd start
```

仓库没有独立 test 脚本，`npm run build` 是最低静态门禁。真实 WebSocket、配对、跨设备合并、快照恢复、反向代理和生产数据必须在隔离环境验证。

## 配置与数据

- 默认读取根 `config.js`；可用 `CONFIG_PATH` 指定外部配置。
- `PORT` / `BIND_IP` 控制监听，默认端口 9527、回环地址。公网部署不得直接暴露明文服务。
- `DATA_PATH` / `LOG_PATH` 指定持久数据和日志；升级前备份配置、`data/` 与 `logs/`。
- `PROXY_HEADER` 只有在可信反向代理覆盖该请求头时才能启用，否则客户端可伪造来源地址。
- `LX_USER_*` 可以注入用户连接码；环境、配置和日志中的连接码均按凭据保护。

## TLS 与运行

服务本身不终止 TLS。非本机连接必须通过 Nginx/Caddy 等可信反向代理提供完整证书链，并同时正确转发 HTTP 与 WebSocket Upgrade。不要仅凭进程启动或 PM2 在线状态判断同步可用。

PM2 是可选进程管理器：构建后可运行 `npm.cmd run prd`，但生产部署、重启、日志轮转和开机启动应由目标环境的服务管理规范负责。

## 同步与导出边界

statistics 采用按设备分桶的状态型 CRDT：同设备逐键取 `max`，跨设备聚合求和。改 feature version、握手、快照或列表结构时必须保持旧客户端兼容或提供明确迁移。

本 fork 的 `GET /export-list` 只读返回指定用户的最新列表快照，不参与同步协议。它使用用户连接凭据鉴权，只能经 TLS 调用；不得把连接码放在 URL、日志、截图或文档示例实值中。认证失败仍计入来源封禁。

## 恢复与升级

停止写入后再恢复快照。任何覆盖远端或清除设备水位的操作都应先复制数据目录，并在隔离用户验证转换结果。源码升级使用 `npm ci && npm run build`，不整目录删除未知配置或用户数据。

## 文档与许可

- [CHANGELOG](CHANGELOG.md)：fork 变更位于 `Unreleased`，其后为上游历史。
- `config.js`：配置字段和默认值的代码事实源。
- [LICENSE](LICENSE)：Apache-2.0。服务只同步用户提供的数据，不授予第三方音乐内容的版权或分发权。
