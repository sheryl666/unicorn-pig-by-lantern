# Unicorn pig（by lantern）

这一版与原来的 `osascript` Lantern 版相互独立：提醒计划由页面中的本地 `setInterval` 驱动，不使用服务器，也不依赖 Codex。

## 两种使用方式

1. 浏览器版：双击 `dist/lantern-reminder.html`。它是内嵌 15 个默认角色、CSS 和 JavaScript 的单文件 HTML。
2. 桌面版：安装 Electron 包后，关闭设置窗口会驻留系统托盘，并继续运行前端倒计时。

页面中的昵称、提醒时间、工作日、间隔、主题颜色和角色包都可以自行设置，配置保存在当前电脑的浏览器或应用本地。

## 本地开发

```bash
npm install
npm test
npm run build:web
npm start
```

Windows 便携 EXE：

```bash
npm run pack:win
```

产物写入 `release/`。

## 可选字体

公开仓库不包含授权范围不明确的字体文件。项目默认使用电脑上的可爱系统字体；如果你已合法取得 `ChildFunSans-CHS.ttf` 的使用及再分发授权，可以将它放到 `assets/fonts/ChildFunSans-CHS.ttf`，再运行 `npm run build:web`，字体就会被内嵌进单文件 HTML。

## 分享给朋友

- 最简单：发送 `dist/lantern-reminder.html`，朋友双击打开并保持页面开启。
- 更稳定：运行 `npm run pack:win` 生成 Windows 便携版，朋友打开后让应用驻留托盘。
- 项目完全离线运行，不会把昵称、图片或提醒配置上传到服务器。

## 定时边界

- 浏览器版只有在 HTML 页面保持打开时才会运行。
- 桌面版只有在应用仍驻留后台时才会运行；勾选“开机自动运行”可减少漏提醒。
- 电脑休眠时 JavaScript 定时器会暂停，唤醒后会立即补触发一次已到期提醒。
- 应用被彻底退出、系统关机或电池耗尽时，纯前端 `setInterval` 无法运行。
