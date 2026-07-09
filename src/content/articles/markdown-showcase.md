---
title: "Markdown 格式展示"
description: "测试 Astro 对 Markdown 各种常用格式的渲染效果。"
pubDate: 2026-07-09
tags: ["Markdown", "Demo"]
featured: true
order: 3
draft: false
---

## 文本样式

**粗体**、*斜体*、***粗斜体***、~~删除线~~、`行内代码`、[链接](https://example.com)

## 标题层级

# H1 一级标题
## H2 二级标题
### H3 三级标题
#### H4 四级标题

## 列表

### 无序列表

- 项目一
- 项目二
  - 嵌套项目
  - 另一个嵌套
- 项目三

### 有序列表

1. 第一步
2. 第二步
   1. 子步骤 A
   2. 子步骤 B
3. 第三步

### 任务列表

- [x] 已完成
- [ ] 待办
- [ ] 另一项待办

## 引用

> 这是一段引用文字。可以很长很长，用来展示引用块的样式。
>
> 引用内部可以分段。
>
> > 嵌套引用，更深一层。

## 代码块

### JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(`fib(10) = ${result}`);
```

### TypeScript

```typescript
interface Config {
  port: number;
  host: string;
  debug?: boolean;
}

const config: Config = {
  port: 3000,
  host: "localhost",
  debug: process.env.NODE_ENV !== "production",
};

async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  return res.json();
}
```

### Python

```python
def quick_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

print(quick_sort([3, 6, 8, 10, 1, 2, 1]))
```

### Shell

```bash
# 查找占用端口的进程
lsof -i :3000 | grep LISTEN

# 统计文件行数
find src/ -name "*.ts" | xargs wc -l | tail -1
```

### YAML / Config

```yaml
server:
  port: 8080
  host: 0.0.0.0

database:
  url: postgresql://localhost:5432/mydb
  pool:
    min: 2
    max: 10

logging:
  level: info
  format: json
```

## 表格

| 工具 | 用途 | 熟练度 |
|------|------|--------|
| Docker | 容器化部署 | ⭐⭐⭐⭐⭐ |
| PostgreSQL | 关系数据库 | ⭐⭐⭐⭐ |
| Redis | 缓存 & 队列 | ⭐⭐⭐⭐ |
| GitHub Actions | CI/CD | ⭐⭐⭐ |
| Kubernetes | 编排 | ⭐⭐ |

## 图片

![占位图](https://placehold.co/800x400/2563eb/ffffff?text=Hello+Astro)

## 分割线

---

上面是一条分割线。

## 脚注

这里有一句带脚注的话[^1]，还有另一个脚注[^note]。

[^1]: 这是第一个脚注的内容。
[^note]: 第二个脚注，`label` 可以是自定义的。

## HTML 内嵌

<details>
<summary>点击展开更多内容</summary>

这里是可以折叠的内容，支持 **Markdown** 格式。

- 列表项
- 另一项

</details>

## 数学公式（如果支持）

行内公式：$E = mc^2$

独立公式：

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

## 强调文本块

> **💡 提示：** 这是一个提示块，常用于文章中强调关键信息。
>
> 可以包含多行内容，甚至 `code` 和 [链接](#)。

> **⚠️ 注意：** 生产环境中请务必配置正确的环境变量。
