import type { PropsWithChildren } from 'react'
import { useLocation } from 'wouter'
import { dataSnapshot } from '../data'
import { classNames, formatVerifiedAt } from '../utils'
import { Link } from './AppLink'

const navigation = [
  { to: '/', code: '00', label: '总览' },
  { to: '/season', code: 'S30', label: '赛季' },
  { to: '/legends', code: 'LG', label: '英雄' },
  { to: '/weapons', code: 'WP', label: '枪械' },
  { to: '/gunsmith', code: 'LAB', label: '枪匠' },
  { to: '/maps', code: 'MP', label: '地图' },
  { to: '/news', code: 'RX', label: '情报' },
  { to: '/community', code: 'CO', label: '社区' },
]

export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /></span>
}

export function Shell({ children }: PropsWithChildren) {
  const [location] = useLocation()
  const isActive = (to: string) => to === '/' ? location === '/' : location.startsWith(to)
  const active = navigation.find((item) => isActive(item.to))

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <Link className="brand-block" to="/" aria-label="APEX INTEL 首页">
          <BrandMark />
        </Link>
        <nav className="primary-nav" aria-label="主要导航">
          {navigation.map((item) => (
            <Link key={item.to} to={item.to} className={classNames('nav-item', isActive(item.to) && 'is-active')}>
              <span className="nav-code">{item.code}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <Link className="sources-shortcut" to="/sources" aria-label="数据来源">SRC</Link>
      </aside>

      <div className="page-frame">
        <header className="topbar">
          <div className="route-readout">
            <span>APEX INTEL</span>
            <i>/</i>
            <strong>{active?.label ?? '数据来源'}</strong>
          </div>
          <div className="snapshot-status">
            <span className="status-dot" />
            <span>{dataSnapshot.season}</span>
            <span className="topbar-date">核验 {formatVerifiedAt(dataSnapshot.verifiedAt)}</span>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div><BrandMark /><strong>APEX INTEL</strong></div>
          <p>非官方社区资料项目，不隶属于 Electronic Arts 或 Respawn Entertainment。</p>
          <nav aria-label="页脚导航">
            <Link to="/sources">数据来源与许可</Link>
            <a href="https://github.com/XXXMrG/apex-intel" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </footer>
      </div>
    </div>
  )
}
