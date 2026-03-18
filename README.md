# Poker Scorekeeper

实时同步的德州扑克记分板（Next.js + Firebase Realtime Database）。

## 功能

- 创建房间并分享链接给同桌玩家
- 实时同步玩家手数、买入、剩余筹码
- 支持筹码/金额双视图
- 内置历史记录与二维码分享

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（复制 `.env.example` 到 `.env.local`）

```bash
cp .env.example .env.local
```

3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`。

## 脚本

- `npm run dev`: 启动开发环境
- `npm run lint`: 运行 ESLint
- `npm test`: 运行 Node 内置测试
- `npm run build`: 生产构建
- `npm run start`: 启动生产服务

## 环境变量

必须配置以下 Firebase 公共变量：

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 目录结构

- `src/app`: Next App Router 页面
- `src/components`: UI 组件与业务组件
- `src/hooks`: 数据订阅 hooks
- `src/lib`: Firebase 服务与业务计算逻辑

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Firebase Realtime Database
- Tailwind CSS 4
