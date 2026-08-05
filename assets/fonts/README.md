# 可选字体

为了避免公开分发授权范围不明确的字体，本仓库不附带字体文件。

如你已合法取得 `ChildFunSans-CHS.ttf` 的使用及再分发授权，可将它放在本目录，然后运行：

```bash
npm run build:web
```

构建脚本会自动把字体内嵌到 `dist/lantern-reminder.html`。未提供字体时，页面会自动使用系统字体。
