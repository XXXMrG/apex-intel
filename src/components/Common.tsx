import type { ReactNode } from 'react'
import { classNames } from '../utils'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  meta?: ReactNode
}

export function PageHeader({ eyebrow, title, description, meta }: PageHeaderProps) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <div className="page-heading-aside">
        <p>{description}</p>
        {meta}
      </div>
    </header>
  )
}

interface DatabaseToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  queryLabel: string
  options: string[]
  selected: string
  onSelectedChange: (value: string) => void
  resultCount: number
}

export function DatabaseToolbar({
  query,
  onQueryChange,
  queryLabel,
  options,
  selected,
  onSelectedChange,
  resultCount,
}: DatabaseToolbarProps) {
  return (
    <div className="database-toolbar">
      <label className="database-search">
        <span className="visually-hidden">{queryLabel}</span>
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={queryLabel} />
        {query && <button type="button" onClick={() => onQueryChange('')} aria-label="清空搜索">×</button>}
      </label>
      <div className="filter-chips" role="group" aria-label="分类筛选">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={classNames(selected === option && 'is-active')}
            onClick={() => onSelectedChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <span className="result-count"><strong>{resultCount}</strong> RECORDS</span>
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  body?: string
}

export function EmptyState({ title = '没有匹配记录', body = '调整关键词或分类后重试。' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span>NO MATCH</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

interface SourceLinkProps {
  url: string
  label?: string
}

export function SourceLink({ url, label = '核验来源' }: SourceLinkProps) {
  return <a className="source-link" href={url} target="_blank" rel="noreferrer">{label}<span>↗</span></a>
}
