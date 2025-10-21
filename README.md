# Poker Scorekeeper

德州扑克记分板是一个基于 React + Firebase 的实时协作工具，帮助牌局参与者记录筹码、结算盈亏并保持账目平衡。应用针对移动端做了优化，无需登录即可通过房间链接访问。

## 核心特性

- **快速建房**：一键生成 6 位大写字母房间号，自动跳转到记分板。
- **实时同步**：基于 Firebase Realtime Database，玩家信息、筹码变化毫秒级同步。
- **自动计算**：根据手数与筹码配置自动得出买入与盈亏，支持手动覆盖特殊情况。
- **移动优先**：表格支持横向滚动、数字键盘输入、按钮 ≥ 44px，适合手机操作。
- **分享便捷**：一键复制链接或生成二维码邀请好友加入。
- **数据校验**：实时提示总账是否平衡，定位多算或少算的筹码。

## 技术栈

- React 19 + TypeScript
- Tailwind CSS
- React Router v6
- Firebase Realtime Database
- Create React App (react-scripts 5)

## 环境变量

在项目根目录创建 `.env.local`，填入 Firebase 配置（示例值请替换成自己的凭证）：

```bash
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://xxx.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=1:xxx:web:xxx
```

## 快速开始

```bash
npm install
npm start
```

项目默认运行在 `http://localhost:3000`。首页可创建新房间，自动跳转到 `/room/:roomId` 进行实时记分。

## 测试

```bash
npm test
```

测试使用 React Testing Library 与 Jest，默认启用 watch 模式。如果只运行一次，可执行 `npm test -- --watchAll=false`。
