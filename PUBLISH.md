# ImageScope 发布指南

## 方式 1：本地分发（.vsix 文件）

### 打包插件

已生成的文件：`imagescope-0.1.0.vsix` (428 KB)

### 本地安装

**方式 A：VS Code 界面安装**
1. 打开 VS Code
2. 点击左侧 Extensions（扩展）图标
3. 点击右上角 `...` 菜单
4. 选择 "Install from VSIX..."
5. 选择 `imagescope-0.1.0.vsix` 文件

**方式 B：命令行安装**
```bash
code --install-extension imagescope-0.1.0.vsix
```

**方式 C：分享给别人**
- 将 `.vsix` 文件上传到网盘或 GitHub Releases
- 别人下载后按方式 A 或 B 安装

---

## 方式 2：发布到 VS Code Marketplace（官方市场）

### 前置准备

#### 1. 创建发布者账号

访问 [https://marketplace.visualstudio.com](https://marketplace.visualstudio.com)

1. 点击 "Publish extensions"
2. 使用 Microsoft 账号登录（或创建新账号）
3. 创建发布者账号：
   - 填写 Publisher Name（例如：`imagescope`）
   - 这会成为插件的唯一标识

#### 2. 获取 Personal Access Token (PAT)

1. 进入 Azure DevOps：[https://dev.azure.com](https://dev.azure.com)
2. 登录同一个 Microsoft 账号
3. 点击左下角用户头像 → "Security"
4. 点击 "Personal access tokens"
5. 点击 "New Token"
6. 配置：
   - **Name**: "ImageScope Release"
   - **Organization**: "All accessible organizations"
   - **Scopes**: 选择 "Marketplace" → "Manage"
7. 点击 "Create"
8. **立即复制 token**（只显示一次！）

### 发布流程

#### 1. 更新 package.json

```json
{
  "publisher": "your-publisher-name",  // 改为你的发布者名称
  "version": "0.1.0"                   // 每次发布时递增
}
```

#### 2. 发布命令

```bash
# 首次发布
vsce publish -p <你的PAT>

# 或分两步：
# 打包
vsce package

# 发布
vsce publish -p <你的PAT>

# 发布新版本（自动递增 patch 版本）
vsce publish patch -p <你的PAT>
```

#### 3. 发布选项

```bash
# 发布为预发布版本（用户需要选择预发布）
vsce publish --pre-release -p <你的PAT>

# 指定版本号
vsce publish 0.2.0 -p <你的PAT>

# 发布到自定义注册表
vsce publish -p <你的PAT> --registryUrl https://your-registry
```

### 发布后

1. **验证发布**：访问 https://marketplace.visualstudio.com/items?itemName=publisher-name.imagescope
2. **VS Code 中搜索**：打开 Extensions，搜索 "imagescope"，应该能看到你的插件
3. **版本管理**：每次更新功能时：
   - 修改 `CHANGELOG.md`
   - 更新 `package.json` 中的 version
   - 执行 `vsce publish`

---

## 版本管理

### 语义化版本号 (Semantic Versioning)

格式：`MAJOR.MINOR.PATCH`

- **MAJOR** (x.0.0)：重大功能变化或不兼容更新
- **MINOR** (0.x.0)：新增向后兼容功能
- **PATCH** (0.0.x)：bug 修复

### 推荐版本更新序列

```
0.1.0  → 初始发布（本地测试完成）
0.1.1  → 修复第一个 bug
0.1.2  → 修复更多 bug
0.2.0  → 增加新功能（直方图、ROI 等）
0.3.0  → 增加新功能（通道切换等）
1.0.0  → 第一个稳定版本
```

---

## Marketplace 上的展示

### 插件主页会显示

- ✅ 图标：`imagescope-icon-128.png`（128x128px）
- ✅ 名称：`displayName` from package.json
- ✅ 描述：`description` from package.json
- ✅ 版本号：`version` from package.json
- ✅ README.md 内容（自动显示）
- ✅ CHANGELOG.md 内容（自动显示）
- ✅ 关键词：`keywords` from package.json
- ✅ 分类：`categories` from package.json

### 优化搜索排名

1. **package.json 中填写完整的元数据**
   ```json
   {
     "keywords": ["image", "viewer", "pixel", "inspection", "roi", "histogram"],
     "categories": ["Visualization"],
     "homepage": "https://github.com/yourusername/imagescope",
     "repository": {
       "type": "git",
       "url": "https://github.com/yourusername/imagescope"
     }
   }
   ```

2. **编写优质 README**
   - 清晰的功能说明
   - 使用截图/GIF
   - 完整的快捷键文档
   - 安装和使用说明

3. **定期更新**
   - 修复 bug
   - 增加功能
   - 更新 CHANGELOG

4. **获取用户反馈**
   - 在 GitHub 上接收 issue
   - 及时响应用户

---

## 故障排查

### 发布失败

**错误：`Invalid publisher name`**
- 确认 publisher 名称与 Azure DevOps 中创建的完全一致

**错误：`Authentication failed`**
- 检查 PAT token 是否正确
- 检查 token 是否已过期
- 重新生成新的 token

**错误：`Version already exists`**
- 递增 version 号
- 或删除已发布的版本（需要在 Marketplace 管理）

### 查看发布状态

```bash
# 查看已发布的版本
vsce list

# 查看发布历史
git log --oneline | grep "version"
```

---

## 本地测试（发布前）

```bash
# 1. 打包
npm run package

# 2. 在本地安装测试
code --install-extension imagescope-0.1.0.vsix

# 3. 在 VS Code 中测试所有功能

# 4. 卸载测试版本
code --uninstall-extension imagescope

# 5. 无问题后发布
vsce publish -p <PAT>
```

---

## 发布后的社区推广

1. **GitHub 发布**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
   然后在 GitHub 上创建 Release

2. **社交媒体分享**
   - Twitter/X
   - Reddit (r/vscode, r/programming)
   - Dev.to

3. **文档和教程**
   - 写博客介绍使用方法
   - 录制使用视频
   - 创建使用示例

---

## 常用命令汇总

```bash
# 安装必需工具
npm install -g @vscode/vsce

# 本地打包
vsce package

# 发布到 Marketplace
vsce publish -p <你的PAT>

# 查看已发布的插件
vsce show imagescope

# 卸载本地的 .vsix
code --uninstall-extension imagescope
```

---

**现在 ImageScope 已经可以分发了！选择适合你的方式：**

- 💻 **本地分发**：简单快速，适合小范围测试
- 🌍 **Marketplace**：全球可见，官方渠道，让更多人使用
