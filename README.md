# Astro Digital Garden Starter

一个面向个人知识库和作品集的 Astro starter。内容全部写在 `src/content`，页面、列表、RSS、搜索、SEO、暗黑模式、评论组件和 Turnstile 验证已经配置好。内置 Decap CMS 在线编辑器，支持 GitHub OAuth 登录和编辑工作流。

## 开始

```bash
npm install
npm run dev
```

## 写内容

在这些目录里新增 Markdown 或 MDX 文件即可自动生成页面：

- `src/content/projects` — 项目作品
- `src/content/notes` — 笔记卡片
- `src/content/articles` — 长文
- `src/content/resources` — 资源推荐
- `src/content/weekly` — 周记
- `src/content/garden` — 数字花园

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

可选字段：

```yaml
featured: true         # 在首页展示
order: 1               # 排序权重（越小越靠前）
updatedDate: 2026-07-10 # 最后更新日期
image: /uploads/cover.png # 封面图
seoTitle: "SEO 标题"   # 覆盖页面 title
seoDescription: "SEO 摘要" # 覆盖 meta description
related:               # 手动关联其他内容
  - notes/markdown-first
  - articles/some-post
```

数字花园可额外设置生长阶段：

```yaml
status: seedling       # seedling | budding | evergreen
```

Markdown 脚注：

```markdown
正文中需要注释的地方加[^1]，页面底部自动汇集脚注内容。

[^1]: 这是脚注的说明文字。
```

### 内容关联

每篇文章底部会自动展示两类关联：

- **上游知识** — 在正文中通过 `[title](/collection/slug)` 引用的笔记/花园条目，自动聚合为"上游知识"区块
- **相关笔记** — 通过 `related` frontmatter 手动关联，或根据标签自动推荐

## Decap CMS 在线编辑

项目集成了 Decap CMS，访问 `/admin/` 即可通过浏览器在线编辑内容，无需本地开发环境。

### 功能

- 可视化编辑所有 collection（Articles、Notes、Projects、Resources、Weekly、Garden）
- 支持 Markdown 编辑、图片上传、封面图、标签管理
- 编辑工作流（Editorial Workflow）：草稿 → 审核 → 发布
- 预览面板样式与前端一致（`preview.css`）
- 通过 GitHub OAuth 登录（无需 Personal Access Token）

### OAuth 配置

编辑功能需要 GitHub OAuth App。配置方式：

1. 在 GitHub 创建 OAuth App：[Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
   - Authorization callback URL: `https://你的域名/api/oauth`
2. 修改 `wrangler.toml` 中 `[vars]` 段的 `GITHUB_CLIENT_ID` 和 `TURNSTILE_SITE_KEY` 为你的值
3. 在 Cloudflare Worker 后台 → Settings → Variables 中添加密钥：
   - `GITHUB_CLIENT_SECRET` — OAuth App 的 Client Secret
   - `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile 密钥
4. 修改 `public/admin/config.yml` 中的 `backend.repo` 和 `site_url` 为你自己的仓库和域名

### CloudCannon（可选）

项目同时内置了 [CloudCannon](https://cloudcannon.com/) 配置（`cloudcannon.config.yml`），可直接连接 CloudCannon 作为可视化 CMS。相比 Decap CMS，CloudCannon 提供托管服务、团队协作和更丰富的编辑体验。两者互不冲突，可按需选用。

## 站点配置

编辑 `src/config/site.ts`：

- `title`、`description`、`url`、`author`、`github`、`lang`、`locale`
- Giscus 评论：`repo`、`repoId`、`category`、`categoryId`、`mapping`、`lang` 等
- 各 collection 的标题和描述：`collections`
- `/now` 页面的当前状态：`nowItems`

同时把 `astro.config.mjs` 的 `site` 和 `public/robots.txt` 的 Sitemap 域名改成你的正式域名。

## 功能特性

| 功能 | 说明 |
|------|------|
| 🌓 暗黑模式 | 主题切换按钮，自动跟随系统，手动切换后记住偏好 |
| 🔍 全文搜索 | `/search/` 页面，客户端搜索，基于 `/search.json` 索引 |
| 📡 RSS | `/rss.xml`，聚合所有已发布内容 |
| 💬 评论 | 基于 Giscus（GitHub Discussions），需在 `site.ts` 配置 |
| 🛡️ Turnstile | Cloudflare Turnstile 人机验证组件和验证 API |
| 📝 Decap CMS | `/admin/` 在线编辑器，GitHub OAuth 登录，预览样式一致 |
| 🖼️ 封面图 | 支持文章封面图，详情页自动渲染 |
| 🌱 数字花园 | 内容关联图：上游知识 + 相关笔记自动聚合 |
| 🏷️ 标签系统 | 每篇文章支持标签，自动生成标签关联推荐 |
| 🔗 内容关联 | 手动 `related` + 自动标签关联 + 正文引用解析 |
| 📎 CC BY-SA 4.0 | 所有内容页面默认显示知识共享许可 |

## 项目结构

```
src/
├── components/        # Header, Footer, Giscus, Turnstile, ContentList
├── config/
│   └── site.ts        # 站点全局配置
├── content/           # Markdown/MDX 内容
│   ├── articles/
│   ├── garden/
│   ├── notes/
│   ├── projects/
│   ├── resources/
│   └── weekly/
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── index.astro             # 首页
│   ├── [collection]/[...slug].astro  # 内容详情页
│   ├── [collection]/index.astro      # 各 collection 列表页
│   ├── search/index.astro      # 搜索页
│   ├── search.json.ts          # 搜索索引 API
│   ├── rss.xml.ts              # RSS feed
│   └── api/
│       ├── oauth.astro         # Decap CMS GitHub OAuth 代理
│       └── turnstile-verify.ts # Turnstile 验证 API
├── styles/
│   └── global.css
└── utils/
    └── content.ts              # 内容查询与关联工具函数
public/
├── admin/
│   ├── index.html              # Decap CMS 入口
│   ├── config.yml              # Decap CMS 配置
│   └── preview.css             # Decap CMS 预览面板样式
├── uploads/                    # Decap CMS 上传的图片
├── _headers                    # 安全头与静态资源缓存
└── robots.txt
```

## 部署到 Cloudflare Workers

项目基于 `@astrojs/cloudflare` 适配器，以 SSR 模式运行在 Cloudflare Workers 上。

```bash
npm run preview   # 本地预览（wrangler dev）
npm run deploy    # 构建并部署（wrangler deploy）
```

`wrangler.toml` 已包含基础配置，`public/_headers` 已配置安全头和静态资源缓存。
