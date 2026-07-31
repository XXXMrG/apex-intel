import type { ReactNode } from 'react'

interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
  sourceUrl?: string
}

export function DetailDrawer({ open, onClose, eyebrow, title, subtitle, children, sourceUrl }: DetailDrawerProps) {
  return (
    <div className={`drawer-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="drawer-scrim" type="button" aria-label="关闭详情" onClick={onClose} />
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <button className="drawer-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {subtitle && <p className="drawer-subtitle">{subtitle}</p>}
        <div className="drawer-body">{children}</div>
        {sourceUrl && <a className="drawer-source" href={sourceUrl} target="_blank" rel="noreferrer">打开核验来源 <span>↗</span></a>}
      </aside>
    </div>
  )
}
