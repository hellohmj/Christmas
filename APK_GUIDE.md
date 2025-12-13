# 如何封装成 APK

由于这是一个 Web 项目，而 Python 脚本无法直接在 Android 手机上运行，我们需要将项目转换为 Android 应用。

我已经修改了代码，使其支持在手机上**手动选择照片**，而不再依赖 Python 脚本自动扫描。

## 方法一：使用在线转换工具（最简单）

你可以使用免费的 "Website to APK" 在线服务。

1.  **准备文件**：
    *   将 `index.html`, `style.css`, `script.js`, `images.js` 放在一个文件夹中。
    *   注意：`start.py` 不需要。

2.  **打包为 ZIP**：
    *   将上述文件压缩成一个 `.zip` 文件。

3.  **使用转换器**：
    *   访问如 [Web2Apk](https://websitetoapk.com/) 或搜索 "HTML to APK converter"。
    *   上传你的 ZIP 文件。
    *   下载生成的 `.apk` 文件并安装到手机。

## 方法二：使用 Capacitor (专业开发)

如果你是开发者，建议使用 Capacitor。

1.  **安装 Node.js**。
2.  **初始化项目**：
    ```bash
    npm init
    npm install @capacitor/core @capacitor/cli @capacitor/android
    npx cap init
    ```
3.  **添加 Android 平台**：
    ```bash
    npx cap add android
    ```
4.  **构建并同步**：
    *   将你的 HTML/JS/CSS 文件放入 `www` 或 `dist` 目录。
    *   运行 `npx cap sync`。
5.  **打开 Android Studio**：
    ```bash
    npx cap open android
    ```
    *   在 Android Studio 中点击 "Run" 或 "Build APK"。

## 手机端使用说明

1.  安装并打开 APP。
2.  点击左下角的 **"📂 选择照片"** 按钮。
3.  从手机相册中选择多张照片。
4.  圣诞树会自动刷新，挂上你选择的照片！
