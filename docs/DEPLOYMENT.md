# 部署与验证

本页是操作入口；历史发布和服务器记录见 [changes.md](changes.md)，不据此判断当前线上状态。

## 同步服务

在 `lx-music-sync-server/` 执行 `npm ci`、`npm run build`，用 `npm start` 启动。开发入口为 `npm run dev`。

- `src/index.ts` 默认绑定 `127.0.0.1`；`Dockerfile` 则设置 `BIND_IP=0.0.0.0`、`PORT=9527`，容器内监听与宿主机端口暴露是两件事。
- `CONFIG_PATH` 指定配置文件，`DATA_PATH` 指定持久化目录；Dockerfile 默认数据路径为 `/server/data/data`。部署前检查实际挂载，备份用户数据，勿凭旧文档假定已持久化。
- 用户通过 `config.js` 或 `LX_USER_<用户名>` 配置；连接码是凭据，不写入文档或仓库。
- 公网反向代理需要 HTTPS 和 WebSocket 升级支持。域名、源站、分支及代理配置以本次实际部署为准；不硬编码旧面板地址。
- `/hello` 可检查 HTTP 链路；仅得到响应不能证明配对、歌单和 statistics 同步可用。用独立测试用户验证双向同步与重连。
- `/export-list` 是使用 `x-user` / `x-key` 鉴权的只读导出入口，不是无鉴权下载接口。

## 客户端

- Desktop 的开发、类型检查和打包入口见 [组件 README](../lx-music-desktop/README.md)。
- Mobile 的 Android 构建和签名要求见 [组件 README](../lx-music-mobile/README.md)。签名冲突时先导出资料，不直接卸载清数据。
- Mineradio 的自定义音源、账号、原生播放和同步独立验收（Mineradio Mobile 已归档）；服务可连通不代表所有音源可播放。
- 各仓独立检查 Git 状态、目标远端、版本和产物；旧记录中的已推送、已安装、已复制到下载目录不作为本次结论。

## 排障

连接失败先分别检查 DNS、IPv4/IPv6、TLS、反代和服务日志，不能仅凭表现认定是 IPv6。统计翻倍先查 `local → clientId` 是否在发送前完成，详见 [架构](architecture.md)。
