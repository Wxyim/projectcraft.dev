# Astro Digital Garden Starter

一个面向个人知识库和作品集的 Astro starter。内容全部写在 `src/content`，页面、列表、RSS、搜索、SEO、暗黑模式、评论组件和 Turnstile 验证已经配置好。

## 开始

```bash
npm install
npm run dev
```

## 写内容

在这些目录里新增 Markdown 或 MDX 文件即可自动生成页面：

- `src/content/projects`
- `src/content/notes`
- `src/content/articles`
- `src/content/resources`
- `src/content/weekly`
- `src/content/garden`

Frontmatter 示例：

```yaml
---
title: "标题"
description: "摘要"
pubDate: 2026-07-09
tags: ["Astro", "Markdown"]
draft: false
---
```

数字花园可额外设置：

```yaml
status: seedling
```

可选值：`seedling`、`budding`、`evergreen`。

Markdown 脚注：

```markdown
正文中需要注释的地方加[^1]，页面底部自动汇集脚注内容。

[^1]: 这是脚注的说明文字。
```

## 站点配置

编辑 `src/config/site.ts`：

- `title`、`description`、`url`、`author`、`github`、`lang`
- Giscus 评论：`repo`、`repoId`、`category`、`categoryId` 等
- 导航栏：`navItems`
- 各 collection 的标题和描述：`collections`

同时把 `astro.config.mjs` 的 `site` 和 `public/robots.txt` 的 Sitemap 域名改成你的正式域名。

## 部署到 Cloudflare Workers

项目基于 `@astrojs/cloudflare` 适配器，以 SSR 模式运行在 Cloudflare Workers 上。

```bash
npm run preview   # 本地预览（wrangler dev）
npm run deploy    # 构建并部署（wrangler deploy）
```

`wrangler.toml` 已包含基础配置，`public/_headers` 已配置安全头和静态资源缓存。
