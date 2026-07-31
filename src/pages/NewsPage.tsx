import { useMemo, useState } from 'react'
import { DatabaseToolbar, EmptyState, PageHeader } from '../components/Common'
import { news } from '../data'
import { formatDate, matchesSearch } from '../utils'

export function NewsPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const categories = useMemo(() => ['全部', ...Array.from(new Set(news.items.map((item) => item.category))).filter(Boolean).sort()], [])
  const filtered = useMemo(() => news.items.filter((item) => {
    const categoryMatch = selectedCategory === '全部' || item.category === selectedCategory
    return categoryMatch && matchesSearch([item.title, item.titleZh, item.summary, item.summaryZh, item.category, ...(item.tags ?? [])], query)
  }), [query, selectedCategory])
  const lead = filtered[0]

  return (
    <div className="news-page">
      <PageHeader
        eyebrow="OFFICIAL TRANSMISSIONS / EA SOURCE"
        title="官方新闻聚合"
        description="只聚合 EA 官方标题、摘要、发布日期、图片与原文链接；中文为本站编辑翻译，以 EA 原文为准。"
        meta={<span className="heading-meta">{news.items.length} OFFICIAL POSTS</span>}
      />
      <DatabaseToolbar
        query={query}
        onQueryChange={setQuery}
        queryLabel="搜索更新、活动或开发者说明"
        options={categories}
        selected={selectedCategory}
        onSelectedChange={setSelectedCategory}
        resultCount={filtered.length}
      />

      {lead ? (
        <>
          <a className="news-lead" href={lead.url} target="_blank" rel="noreferrer">
            <div className="news-lead-image" style={lead.image ? { backgroundImage: `url("${lead.image}")` } : undefined}>
              <span>01 / PRIORITY TRANSMISSION</span>
            </div>
            <div className="news-lead-copy">
              <span className="news-category">{lead.category}</span>
              <time dateTime={lead.date}>{formatDate(lead.date)}</time>
              <h2>{lead.titleZh ?? lead.title}</h2>
              <p>{lead.summaryZh ?? lead.summary}</p>
              <b>前往 EA 阅读原文 <span>↗</span></b>
            </div>
          </a>

          <section className="news-grid" aria-live="polite">
            {filtered.slice(1).map((item, index) => (
              <a className="news-card" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                <div className="news-card-image">
                  {item.image && <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                  <span>{String(index + 2).padStart(2, '0')}</span>
                </div>
                <div className="news-card-copy">
                  <div><span>{item.category}</span><time dateTime={item.date}>{formatDate(item.date)}</time></div>
                  <h2>{item.titleZh ?? item.title}</h2>
                  <p>{item.summaryZh ?? item.summary}</p>
                  <b>EA.COM ↗</b>
                </div>
              </a>
            ))}
          </section>
        </>
      ) : <EmptyState title="未找到官方情报" body="更换关键词或分类后重试。" />}
    </div>
  )
}
