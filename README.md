# Astro Digital Garden Starter

一个面向个人知识库和作品集的 Astro starter。内容全部写在 `src/content`，页面、列表、RSS、搜索、SEO、暗黑模式和评论组件已经配置好。

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

## 站点配置

编辑 `src/config/site.ts`：

- `title`、`description`、`url`、`author`
- Giscus 的 `repo`、`repoId`、`categoryId`

同时把 `astro.config.mjs` 的 `site` 和 `public/robots.txt` 的 Sitemap 域名改成你的正式域名。

## Cloudflare Pages

Cloudflare Pages 使用：

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `24`

项目已包含 `wrangler.toml` 和 `public/_headers`。
