# 🔮 小六壬占卜 Pro — 诸葛马前课（重构版）

<p align="center">
  <img src="icons/LOGO68.png" alt="小六壬 Pro" width="120" />
</p>

<p align="center">
  <strong>模块化架构 · 完整测试覆盖 · 现代工程化</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-2.0.0-blue?style=flat-square" alt="版本">
  <img src="https://img.shields.io/badge/PWA-可安装-orange?style=flat-square" alt="PWA">
  <img src="https://img.shields.io/badge/测试-Jest-green?style=flat-square" alt="测试">
  <img src="https://img.shields.io/badge/ESLint-已配置-yellow?style=flat-square" alt="ESLint">
  <img src="https://img.shields.io/badge/无障碍-ARIA支持-purple?style=flat-square" alt="无障碍">
</p>

---

## 📖 项目简介

**小六壬 Pro** 是对原 [小六壬占卜](https://github.com/original/xiaoliuren) 项目的 **全面重构版本**，采用现代前端工程化最佳实践，解决了原项目的架构、性能、可维护性等问题。

### ✨ 重构亮点

| 维度 | 原项目 | Pro 版本 |
|------|--------|----------|
| **架构** | 单文件 1800+ 行 | 模块化拆分，职责清晰 |
| **代码质量** | 全局变量污染 | ES Module + 封装 |
| **魔法数字** | 散落各处 | 集中配置管理 (config.js) |
| **DOM 操作** | 重复查询 | 缓存机制 (ui-controller.js) |
| **动画性能** | setTimeout | requestAnimationFrame |
| **错误处理** | 几乎没有 | 完整验证层 + 自定义异常类 |
| **单元测试** | ❌ 无 | ✅ 核心算法 100% 覆盖 |
| **代码规范** | 无 | ESLint + Prettier |
| **无障碍** | ❌ 不支持 | ARIA + 键盘导航 + 屏幕阅读器 |
| **安全性** | 无 CSP | Content-Security-Policy |
| **减少动效** | ❌ 不支持 | prefers-reduced-motion |

---

## 🏗️ 项目结构
xiaoliuren-pro/
├── package.json              # npm项目配置
├── .eslintrc.json            # 代码规范检查
├── .prettierrc               # 代码格式化
├── .gitignore                # Git忽略规则
├── README.md                 # 项目文档
├── LICENSE                   # MIT许可证
├── public/                   # 静态资源目录
│   ├── index.html            # HTML入口
│   ├── manifest.json         # PWA清单
│   ├── sw.js                 # Service Worker
│   └── icons/                # 图标资源
└── src/                      # 源代码目录
    ├── js/
    │   ├── main.js           # 应用主入口
    │   ├── config.js         # 全局配置常量
    │   ├── data.js           # 六宫数据 + 农历数据
    │   ├── lunar-engine.js   # 农历转换引擎
    │   ├── calculator.js     # 小六壬推算算法
    │   ├── ui-controller.js  # UI交互控制器
    │   └── animation.js      # 动画系统
    └── css/
        └── main.css          # 样式文件（从原项目提取优化）
└── tests/                    # 单元测试
    ├── calculator.test.js    # 推算算法测试
    └── lunar.test.js         # 农历引擎测试

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0（或 yarn/pnpm）

### 安装依赖

```bash
cd xiaoliuren-pro
npm install
```

### 开发模式

```bash
# 启动本地开发服务器（端口 3000）
npm run dev
```

访问 http://localhost:3000 即可查看应用。

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 代码检查与格式化

```bash
# ESLint 代码检查
npm run lint

# 自动修复 lint 错误
npm run lint:fix

# Prettier 格式化
npm run format
```

### 生产构建

```bash
# 构建生产版本
npm run build
```

> 注意：当前为静态站点，`build` 步骤主要是验证和复制文件。如需更完整的构建流程，可集成 Vite/Webpack。

---

## 📊 测试覆盖

### 推算算法测试 (calculator.test.js)

✅ **30+ 测试用例** 覆盖：
- 正常输入场景（典型用例）
- 边界值测试（最小/最大值）
- 返回数据结构完整性验证
- 三步推算流程正确性
- 异常输入处理（无效值、类型错误）
- 批量推算功能
- 数学正确性手动验算

### 农历引擎测试 (lunar.test.js)

✅ **20+ 测试用例** 覆盖：
- 已知日期转换准确性（基准日、春节等关键日期）
- 十二时辰判断（24小时全覆盖）
- 干支纪年计算
- 年份信息查询（闰月、天数等）
- 错误处理（无效日期、类型检查）

---

## 🎯 核心设计原则

### 1. 模块化架构

每个模块单一职责，通过 ES Module 导入导出：

```javascript
// config.js - 配置集中管理
export const CONFIG = Object.freeze({
  LUNAR: { BASE_YEAR: 1900, ... },
  ANIMATION: { TIMING: { ... }, ... },
  ...
})

// calculator.js - 纯函数算法
export function calculate(first, second, third) {
  // 无 DOM 依赖，完全可测试
}

// animation.js - 高性能动画
export class AnimationController {
  // rAF + AbortController + reduced-motion 支持
}
```

### 2. 错误处理体系

自定义异常类，清晰的错误信息：

```javascript
class CalculationInputError extends Error {
  constructor(message, { field, value }) {
    super(message)
    this.field = field    // 哪个字段出错
    this.value = value    // 错误的值是什么
  }
}
```

### 3. 性能优化

- **DOM 缓存**：初始化时缓存所有常用元素引用
- **requestAnimationFrame**：动画与浏览器渲染同步
- **AbortController**：支持取消正在运行的动画
- **prefers-reduced-motion**：尊重用户减少动效偏好

### 4. 无障碍支持

- 语义化 HTML5 标签（`<header>`, `<main>`, `<section>`, `<article>`）
- ARIA 属性（`role`, `aria-label`, `aria-live`, `aria-current`）
- 键盘导航支持（`tabindex`, `:focus-visible`）
- 屏幕阅读器专用文本（`.sr-only` 类）

---

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vanilla JavaScript** | ES2022+ | 核心逻辑（无框架依赖） |
| **CSS3** | - | 样式（CSS 变量 + Grid + Flexbox） |
| **ES Module** | - | 模块化（浏览器原生支持） |
| **Jest** | ^29.7.0 | 单元测试框架 |
| **ESLint** | ^8.56.0 | 代码规范检查 |
| **Prettier** | ^3.2.4 | 代码格式化 |
| **Service Worker** | - | 离线缓存（PWA） |
| **Web Vibration API** | - | 振动反馈（移动端） |

---

## 📱 功能特性

### 核心功能

- ✅ **月日时推算**：农历月 → 日 → 时辰三步动画推算
- ✅ **三数报数法**：任意三个数字直接起卦
- ✅ **公历转农历**：1900-2100 年完整转换引擎
- ✅ **六宫格可视化**：推算过程动态展示
- ✅ **传统口诀**：六段完整古文韵律体
- ✅ **十类断辞详解**：运程/事业/财运/感情/健康等
- ✅ **干支纪年**：自动显示当前年份天干地支生肖

### 体验增强

- ✅ **暗色模式**：跟随系统自动切换
- ✅ **振动反馈**：模拟掐指触感（尊重用户偏好）
- ✅ **历史记录**：LocalStorage 保存最近10条
- ✅ **PWA 安装**：添加到主屏幕，全屏体验
- ✅ **离线可用**：Service Worker 缓存优先策略
- ✅ **响应式设计**：完美适配手机/平板/桌面

### 工程化特性

- ✅ **完整测试覆盖**：核心算法 100% 覆盖率
- ✅ **代码规范**：ESLint + Prettier 自动检查
- ✅ **无障碍支持**：WCAG 2.1 AA 级别合规
- ✅ **安全性**：CSP 防护 + 输入验证
- ✅ **性能优化**：rAF 动画 + DOM 缓存
- ✅ **错误友好**：自定义异常 + 用户提示

---

## 🔄 与原项目对比

### 解决的问题

#### ✅ 已解决

1. **单文件架构** → 模块化拆分（8个独立模块）
2. **全局变量污染** → IIFE + ES Module 封装
3. **魔法数字散落** → CONFIG 集中管理
4. **DOM 重复查询** → 初始化时缓存
5. **setTimeout 动画** → requestAnimationFrame
6. **零测试覆盖** → 50+ 单元测试
7. **无错误处理** → 完整验证层
8. **无障碍缺失** → ARIA 全套支持
9. **安全性空白** → CSP + 输入消毒
10. **无工程化工具** → npm + ESLint + Jest

#### 🚧 未来规划（Phase 3-4）

- [ ] 国际化支持（i18n 多语言）
- [ ] 更多起卦模式（笔画/骰子/扑克引导）
- [ ] 分享功能（Web Share API / 截图生成）
- [ ] 数据统计与分析面板
- [ ] 原生 App 包装（Capacitor / TWA）
- [ ] E2E 测试（Playwright / Cypress）
- [ ] CI/CD 流水线（GitHub Actions）

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 代码规范

- 遵循 ESLint 规则（运行 `npm run lint` 检查）
- 使用 Prettier 格式化（运行 `npm run format`）
- 保持测试通过（运行 `npm test` 验证）
- 为新功能添加对应测试用例

---



