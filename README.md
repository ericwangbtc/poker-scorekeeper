# Poker Scorekeeper

实时同步的德州扑克记分板。Cloudflare Worker 提供页面、静态资源和房间 API。每个房间使用独立的 SQLite Durable Object 保存状态，通过 WebSocket 同步玩家、筹码和历史记录。

- 创建房间后，可通过链接或二维码邀请玩家。
- 支持筹码和金额双视图。房主可以修改手数，也可以通过 PIN 转移房主权限。
- 每个房间保留 30 天，保存最近 200 条历史记录。

## 本地开发

需要 Node.js 24 和 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:5173。页面、房间 API 和 WebSocket 共用本地地址。

## 部署到 Cloudflare

```bash
pnpm exec wrangler login
pnpm deploy
```

`pnpm deploy` 会构建 vinext 应用，并使用 Wrangler 发布前端、房间服务和 Durable Object 绑定。部署完成后，Wrangler 会输出访问地址。旧房间和历史记录不导入 Cloudflare。

## 检查生产构建

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm preview
```

生产构建预览默认使用 http://localhost:8787。
