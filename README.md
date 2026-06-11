# 🔮 小六壬占卜 Pro

<p align="center">
  <img src="icons/LOGO68.png" alt="小六壬 Pro" width="120" />
</p>

<p align="center">
  <strong>诸葛马前课 · 掌诀推算 · PWA 手机App</strong><br>
  <sub>模块化架构 · 完整测试覆盖 · 现代工程化</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PWA-可安装-orange?style=flat-square" alt="PWA">
  <img src="https://img.shields.io/badge/测试-Jest-green?style=flat-square" alt="测试">
  <img src="https://img.shields.io/badge/许可证-MIT-brightgreen?style=flat-square" alt="许可证">
</p>

<p align="center">
  🌐 <strong>在线使用</strong><br>
  <a href="https://bingpohe.github.io/xiaoliuren-pro/">https://bingpohe.github.io/xiaoliuren-pro</a><br>
  <sub>手机浏览器打开 → 添加主屏幕 → 即可安装为独立 App</sub>
</p>

---

## 📖 简介

**小六壬 Pro** 是传统占卜术的现代化 PWA 应用。输入农历月日时或任意三个数字，即可掐指一算，断吉凶祸福。

相比原单文件版本，Pro 版采用模块化架构重构，引入 Jest 单元测试、ESLint 规范检查、requestAnimationFrame 高性能动画等现代前端实践。

### 原版 vs Pro

| 维度 | 原版 | Pro |
|------|------|-----|
| 架构 | 单文件 1800+ 行 | 7 个 ES Module |
| 测试 | 无 | 50+ 用例，核心算法全覆盖 |
| 动画 | setTimeout | rAF + 三段变速 |
| 代码规范 | 无 | ESLint + Prettier |
| 配置管理 | 散落各处 | 集中 config.js |
| 无障碍 | 无 | ARIA + 键盘导航 |

---

## 🚀 快速开始

```bash
git clone https://github.com/bingpohe/xiaoliuren-pro.git
cd xiaoliuren-pro
npm install
npm run dev        # 启动本地服务器 → http://localhost:3000
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm test` | 运行测试 |
| `npm run test:coverage` | 测试 + 覆盖率报告 |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |

---

## 📂 项目结构

```
xiaoliuren-pro/
├── index.html              # 主页面
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker（离线缓存）
├── package.json            # 项目配置
├── .eslintrc.json          # ESLint 配置
├── .prettierrc             # Prettier 配置
├── icons/                  # App 图标
├── src/
│   ├── css/
│   │   └── main.css        # 完整样式表
│   └── js/
│       ├── main.js         # 主入口（模块编排）
│       ├── config.js       # 全局配置常量
│       ├── data.js         # 掌诀数据 + 农历编码
│       ├── lunar-engine.js # 公历→农历转换引擎
│       ├── calculator.js   # 小六壬推算核心算法
│       ├── animation.js    # 动画控制器（rAF + 三段变速）
│       └── ui-controller.js# DOM 操作与状态管理
└── tests/
    ├── calculator.test.js  # 推算算法测试（30+ 用例）
    └── lunar.test.js       # 农历引擎测试（20+ 用例）
```

---

## 🎯 设计要点

**模块化** — 每个模块单一职责，通过 ES Module 导入导出，无框架依赖。

**集中配置** — 所有魔法数字、阈值、CSS 类名集中在 `config.js`，修改一处全局生效。

**动画性能** — 使用 requestAnimationFrame 替代 setTimeout；三段变速策略（起手慢→中段快→末段渐慢）确保长推算动画体验流畅。

**全测试覆盖** — 推算算法和农历引擎 50+ 测试用例，覆盖正常输入、边界值、异常输入、类型检查。

---

## 📱 部署

### GitHub Pages

1. 仓库 Settings → Pages
2. Source 选 `Deploy from a branch` → `main` → `/ (root)` → Save
3. 访问 `https://bingpohe.github.io/xiaoliuren-pro/`

### 其他平台

将文件夹上传至任意静态托管即可（Vercel / Netlify / Cloudflare Pages），无需构建。

---

## 🔧 技术栈

HTML5 + CSS3 + Vanilla JS (ES2022+) · PWA · Service Worker · Jest · ESLint · Prettier

---

## 📄 许可证

MIT License
