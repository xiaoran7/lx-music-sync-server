# LX Music Sync Server (多端数据同步服务增强版)

基于 Node.js 与 WebSocket 开发的高性能轻量数据同步服务。本项目为原作者 **lyswhut (落雪无痕)** 开源项目 [lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server) 的增强分支 (Fork)，在完整保留官方列表与 Dislike 黑名单无感同步的基础上，深度扩展了跨设备听歌历史与按设备分桶的状态型 CRDT 播放统计同步能力。

---

## 🌟 致敬原作者与开源致谢

本项目首先向原作者 **[lyswhut](https://github.com/lyswhut)** 致以崇高的敬意与感谢！原作者独立架构并实现了落雪音乐生态极其优雅的端到端同步协议（RSA 动态密钥交换、AES 数据加密传输与快照版本演进），为全家桶多端协同奠定了坚实的基础。

- **原作者 GitHub**：[lyswhut](https://github.com/lyswhut)
- **上游官方仓库**：[lx-music-sync-server](https://github.com/lyswhut/lx-music-sync-server)
- **官方使用文档**：[LX Music Document](https://lyswhut.github.io/lx-music-doc/)

本项目严格遵循开源社区规范与 Apache-2.0 开源协议，所有二次开发改动均公开透明，仅供技术研究、学习与个人交流使用。

---

## 🎧 落雪全家桶 (LX Music Suite) 生态架构

本项目是“落雪全家桶”协同生态中的核心同步中枢。全家桶由“双客户端 + 双服务端”组成，构建了跨设备无缝流转的闭环体验：

```text
               ┌───────────────────────────────┐
               │    落雪全家桶 (LX Music Suite)   │
               └───────────────┬───────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────┐                               ┌──────────────┐
│  客户端集群   │                               │  服务端中枢   │
└──────┬───────┘                               └──────┬───────┘
       │                                               │
       ├─► LX Music Desktop (桌面端客户端)               ├─► LX Music Sync Server (多端数据同步服务，本仓库)
       │   - 平台：Windows / macOS / Linux             │   - 协议：WebSocket 双向实时同步
       │   - 特性：大屏听歌统计、多端聚合、私有云分享     │   - 功能：歌单/黑名单同步 + CRDT 听歌统计
       │                                               │
       └─► LX Music Mobile (移动端客户端)               └─► LX Music Share Server (私有云音乐分享服务)
           - 平台：Android (React Native)              │   - 架构：FastAPI + APlayer + Nginx 206
           - 特性：后台长效保活、设备分桶、一键私有分享    │   - 功能：单曲转存、沉浸单页、留言板、TTL 自动清理
```

1. **LX Music Sync Server (多端数据同步服务，本仓库)**：
   - 负责管理多客户端长连接，提供秒级歌单/收藏/黑名单实时双向增量同步。
   - 核心拓展：引入基于设备唯一标识（Device ID）的状态型 CRDT（Conflict-free Replicated Data Type）数据模型，同设备逐键取 `max`，跨设备聚合时求和，完美解决手机与电脑同时听歌时的播放次数并发覆盖痛点。
2. **LX Music Desktop (桌面端客户端)**：
   - 基于 Electron + Vue 3 开发，跨平台覆盖 Windows、macOS 与 Linux。
   - 消费本同步服务，实时呈现全局听歌排行榜与设备分桶明细。
3. **LX Music Mobile (移动端客户端)**：
   - 基于 React Native 开发，针对 Android 系统深度优化。
   - 手机后台听歌数据本地持久化，联网后自动与服务端完成 CRDT 握手与增量合并。
4. **LX Music Share Server (私有云音乐分享服务)**：
   - 基于 Python FastAPI + APlayer 打造的独立单页分享系统，接收客户端推送的单曲并生成免安装即开即播的高保真网页单页。

---

## 🛠️ 服务端保姆级部署教程

推荐在自建云服务器（VPS）或家庭 NAS 服务器上部署，建议配合域名与 HTTPS 证书使用。

### 方式 1：Docker 一键部署 (强烈推荐)

创建 `docker-compose.yml` 文件：

```yaml
version: "3.8"

services:
  lx-music-sync:
    image: lyswhut/lx-music-sync-server:latest
    container_name: lx-music-sync
    restart: unless-stopped
    ports:
      - "9527:9527"
    environment:
      - PORT=9527
      - BIND_IP=0.0.0.0
      - LX_USER_user1=YourStrongSyncPassword123
    volumes:
      - ./data:/server/data
      - ./logs:/server/logs
```

启动容器：

```bash
docker compose up -d
```

> **参数说明**：
> - `LX_USER_<用户名>`：指定用户的连接密钥（例如 `LX_USER_user1=YourStrongSyncPassword123`），客户端配置时输入该密钥即可。
> - `PORT`：服务监听端口，默认 `9527`。
> - `BIND_IP`：容器内监听地址，容器化环境必须设为 `0.0.0.0`。

---

### 方式 2：Node.js 源码直接运行

#### 环境要求
- Node.js 16+ 或 18+
- npm 8+
- Git

#### 构建与启动

```bash
# 1. 克隆代码并安装依赖
git clone https://github.com/xiaoran7/lx-music-sync-server.git
cd lx-music-sync-server
npm ci

# 2. 编译生产代码
npm run build

# 3. 启动服务 (默认监听 127.0.0.1:9527)
npm start
```

若需常驻后台守护，可使用 PM2：

```bash
npm install -g pm2
pm2 start dist/index.js --name "lx-music-sync"
pm2 save
```

---

### 关键配置项 (`config.js`)

在根目录下创建或修改 `config.js`（也可通过环境变量传入）：

```javascript
module.exports = {
  port: 9527,                  // 监听端口
  bindIP: '127.0.0.1',         // 监听网卡 (搭配 Nginx 反代建议保持 127.0.0.1)
  dataPath: './data',          // 列表数据与快照保存路径
  logPath: './logs',           // 日志输出路径
  maxSnapshotNum: 10,          // 历史快照最多保留份数
  // proxyHeader: 'x-forwarded-for', // 若通过 Nginx 反代且需精确封禁恶意 IP 时开启
}
```

---

### 配置 Nginx 反向代理与 SSL (必看)

公网部署必须通过 Nginx 配置 HTTPS 与 WebSocket 转发，示例配置如下：

```nginx
server {
    listen 80;
    server_name sync.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sync.example.com;

    ssl_certificate     /etc/letsencrypt/live/sync.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sync.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:9527;
        proxy_http_version 1.1;
        
        # 核心：必须配置 WebSocket 握手升级，否则客户端实时同步会断连
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

---

### 📱 客户端连接步骤

1. 打开桌面端或移动端 App，进入“设置” -> “同步”；
2. 勾选“启用同步服务”；
3. 服务器地址填写：`https://sync.example.com`（若无域名且在家庭局域网测试，填 `http://服务器IP:9527`）；
4. 连接码输入配置的用户密钥（如 `YourStrongSyncPassword123`）；
5. 点击“连接”，状态变为“已连接”即表示实时多端同步生效。

---

## 💻 本地开发与门禁校验

```bash
# 启动热重载开发模式
npm run dev

# 静态构建检查 (生产门禁)
npm run build
```

---

## 📄 许可协议与免责声明

1. 本项目基于 [Apache License 2.0](LICENSE) 协议开源。
2. 本服务仅负责同步用户本地存储的歌单数据、配置标识与统计数值，不提供、不存储、不分发任何受版权保护的第三方音乐文件。
3. 本项目仅供技术研究与学习交流，请自觉遵守当地法律法规并尊重知识产权。
