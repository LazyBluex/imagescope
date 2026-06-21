# 🚀 ImageScope 快速发布指南

## 5 分钟快速开始

### 步骤 1：本地打包（已完成）

```bash
# 生成 .vsix 文件
npm run package
# ✅ 生成：imagescope-0.1.0.vsix (428 KB)
```

### 步骤 2：分享给朋友（本地方式）

**方式 A：直接分享 .vsix 文件**
```
imagescope-0.1.0.vsix → 发送给朋友
朋友在 VS Code 中：Extensions → Install from VSIX
```

**方式 B：上传到 GitHub Releases**
1. 创建 GitHub 仓库（如果还没有）
2. 创建 Release，上传 .vsix 文件
3. 朋友下载后安装

### 步骤 3：发布到官方市场（VS Code Marketplace）

#### 3.1 注册发布者账号（5 分钟）

1. 访问 [https://marketplace.visualstudio.com](https://marketplace.visualstudio.com)
2. 用 Microsoft 账号登录
3. 创建发布者：Publisher Name = `imagescope`
4. 记住你的发布者名称

#### 3.2 获取 PAT Token（3 分钟）

1. 访问 [https://dev.azure.com](https://dev.azure.com)
2. Security → Personal access tokens → New Token
3. 配置：
   - Name: "ImageScope"
   - Scopes: Marketplace → Manage
4. 创建并**立即复制** token

#### 3.3 发布（1 分钟）

```bash
# 替换成你的 PAT token
vsce publish -p yourPATtoken

# ✅ 发布完成！
```

---

## 发布后

### 在 VS Code 中搜索

1. 打开 VS Code
2. Extensions (Ctrl+Shift+X)
3. 搜索 "imagescope"
4. 看到你的插件 → Install

### 查看你的插件主页

```
https://marketplace.visualstudio.com/items?itemName=你的发布者名.imagescope
```

---

## 后续更新

每次更新时：

```bash
# 1. 更新代码
# ... 修改功能 ...

# 2. 更新版本
# 编辑 package.json，修改 version: "0.2.0"
# 编辑 CHANGELOG.md，添加更新日志

# 3. 发布新版本
vsce publish -p yourPATtoken
```

或使用自动递增：

```bash
# 自动递增 patch 版本（0.1.0 → 0.1.1）
vsce publish patch -p yourPATtoken

# 或递增 minor 版本（0.1.0 → 0.2.0）
vsce publish minor -p yourPATtoken
```

---

## 两种发布方式对比

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **本地 .vsix** | ✅ 即时生效<br/>✅ 完全控制<br/>✅ 无需账号 | ❌ 需要手动分享<br/>❌ 难以发现 | 小范围测试<br/>团队内部使用 |
| **Marketplace** | ✅ 全球可见<br/>✅ 官方渠道<br/>✅ 易于发现 | ❌ 需要审核<br/>❌ 需要账号<br/>❌ 审核时间 | 公开发布<br/>获取用户 |

---

## 当前项目状态

✅ **已完成**
- [x] 功能开发完成
- [x] 文档齐全（README、快捷键、发布指南）
- [x] 产品图标设计
- [x] .vsix 打包完成
- [x] 发布指南编写

🎯 **下一步**
- [ ] 创建 GitHub 仓库
- [ ] 发布到 VS Code Marketplace（可选）
- [ ] 获取用户反馈
- [ ] 持续更新和改进

---

## 常见问题

**Q: 发布要钱吗？**
A: 不要钱。VS Code Marketplace 发布完全免费。

**Q: 多久能看到我的插件？**
A: 本地 .vsix 立即可用。Marketplace 上传后通常 5-15 分钟内可搜索到。

**Q: 发布后还能修改吗？**
A: 可以。更新代码后递增版本号重新发布就行。

**Q: 可以删除已发布的版本吗？**
A: 可以在 Marketplace 管理后台删除，但建议保留所有版本记录。

**Q: 如何增加插件的下载量？**
A: 
- 编写优质 README 和文档
- 在 GitHub 上活跃维护
- 分享到社区（Reddit、Dev.to 等）
- 定期更新和改进

---

## 需要帮助？

查看完整文档：
- 📖 [PUBLISH.md](./PUBLISH.md) - 详细发布指南
- 📋 [README.md](./README.md) - 功能和使用说明
- ⌨️ [SHORTCUTS.md](./SHORTCUTS.md) - 快捷键参考
- 🤝 [CONTRIBUTING.md](./.github/CONTRIBUTING.md) - 贡献指南

---

**现在你可以：**

1. **分享给朋友**：发送 imagescope-0.1.0.vsix 文件
2. **发布到市场**：按上面的步骤发布到 Marketplace
3. **继续开发**：添加更多功能，定期更新

祝你的 ImageScope 插件获得好评！🎉
