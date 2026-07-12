export const site = {
  title: 'projectcraft.dev',
  description: '把零散的想法种进数字花园，让知识生根、连接、生长。',
  url: 'https://projectcraft.dev',
  author: 'Xaver W',
  github: 'https://github.com/Wxyim',
  lang: 'zh-CN',
  locale: 'zh_CN',
  giscus: {
    repo: 'Wxyim/comments-for-projectcraft.dev',
    repoId: 'R_kgDOTS37Cw',
    category: 'Announcements',
    categoryId: 'DIC_kwDOTS37C84DA0Me',
    mapping: 'pathname',
    strict: '0',
    reactionsEnabled: '1',
    emitMetadata: '0',
    inputPosition: 'top',
    lang: 'zh-CN'
  }
} as const;

export const collections = {
  projects: { title: 'Projects', description: '花园里结出的果实，一个个完整打磨的作品。' },
  notes: { title: 'Notes', description: '每一张卡片都是数字花园里的一颗种子。' },
  articles: { title: 'Articles', description: '慢下来写，让每棵知识树经得起时间的推敲。' },
  resources: { title: 'Resources', description: '为花园挑选的好工具，精心筛选的养料与水源。' },
  weekly: { title: 'Weekly', description: '园丁日志，记录花园里每周的生长与变化。' },
  garden: { title: '数字花园', description: '将 Notes、Articles、Garden 自动组织成知识树，发现关联与上游知识。' }
} as const;

export const nowItems = [
  { emoji: '🚧', label: 'Building', text: 'projectcraft.dev' },
  { emoji: '📖', label: 'Reading', text: 'Designing Data Intensive Applications' },
  { emoji: '🎯', label: 'Learning', text: 'AI Coding' },
] as const;
