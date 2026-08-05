# 踩坑点 / Gotchas

本文件记录本仓库（`xiaoran7/lx-music-improve` 仓库 `main` 分支，自定义 statistics CRDT 同步模块）
二次开发时遇到的部署/架构坑。排查前先看，避免重复诊断。

- **1Panel 直接从 `main` 分支根目录 build 镜像**，不能把项目改成子目录结构（例如挪进 `server/` 之类的子文件夹），否则线上构建会找不到入口。
- mineradio 自 2026-07-07 起作为真实设备接入本同步协议（RSA/AES 配对握手 + WebSocket + message2call RPC），改协议前确认不会破坏 mineradio 端现有连接逻辑（对侧实现见 `mineradio` 仓库同步相关代码）。

相关：`../../mineradio-moblie` 也走本同步协议的移动端实现；线上地址 `https://sync.tannerlab.xyz`。
