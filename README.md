# Poker Scorekeeper

实时同步的德州扑克记分板。Cloudflare Worker 提供页面、静态资源和房间 API。每个房间使用独立的 SQLite Durable Object 保存状态，通过 WebSocket 同步玩家、筹码和历史记录。

- 创建房间后，可通过链接或二维码邀请玩家。
- 统一使用筹码记录买入、剩余和盈亏。房主可以修改手数，也可以通过 PIN 转移房主权限。
- 每个房间保留 30 天，保存最近 200 条历史记录。

## 本地开发

需要 Node.js 24 和 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:5173。页面、房间 API 和 WebSocket 共用本地地址。

## 部署到 Cloudflare

推送到 GitHub 的 `main` 分支后，Cloudflare Workers Builds 会运行 `pnpm run build`，再使用 Wrangler 将构建产物发布到生产 Worker `poker-scorekeeper`。可以在 Cloudflare 控制台的 Deployments 页面查看部署结果。

## 检查生产构建

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm preview
```

生产构建预览默认使用 http://localhost:8787。
