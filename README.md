# TokenPet

一个小小的方块世界，正在等待孵化。

3D 体素字标、五颜六色的方块蛋、轻轻跳动的循环动画。点一颗蛋，它会跳得高一点。

## 本地浏览

直接双击 **`dist/index.html`**，不需要服务器、网络或账号。

也可以使用本地预览：

```sh
npm ci
npm run preview
```

打开 `http://127.0.0.1:4177/`。

## 修改与构建

```sh
npm ci
npm run build
```

- `src/main.js`：Three.js 体素模型、3D 字标、布局与跳动动画。
- `src/style.css`：全屏布局与少量控件。
- `src/page.html`：页面模板。
- `dist/index.html`：构建后的独立页面，脚本和样式均内嵌。

支持触屏、键盘和减少动态效果设置；暂停或隐藏页面时停止动画循环。所有图形均由代码生成，无贴图、外部字体、统计或网络请求。

视觉布局参考 [Poteto Playground](https://www.poteto.com/)，使用原创的方块蛋与体素字标，没有使用其角色素材。

品牌名称：**TokenPet**，计划域名：**TokenPet.ai**。当前仅本地预览，没有部署网站或修改 DNS。

Three.js r180 遵循 MIT 许可证，完整声明保存在 `licenses/three-LICENSE.txt`，并内嵌于独立 HTML 文件。
