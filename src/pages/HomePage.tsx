import { Link } from '../components/AppLink'
import { attachments, dataSnapshot, legends, maps, news, season, weapons } from '../data'
import { formatDate, formatVerifiedAt } from '../utils'

const databaseLinks = [
  { to: '/legends', code: 'LG', label: '英雄与技能', count: () => `${dataSnapshot.counts.legends} / ${dataSnapshot.counts.abilities}` },
  { to: '/weapons', code: 'WP', label: '当前枪械', count: () => String(dataSnapshot.counts.weapons) },
  { to: '/maps', code: 'MP', label: '地图档案', count: () => String(dataSnapshot.counts.maps) },
  { to: '/news', code: 'RX', label: '官方情报', count: () => String(dataSnapshot.counts.news) },
]

export function HomePage() {
  const lead = news.items[0]
  const currentBattleRoyaleMaps = maps.items.filter((map) => map.mode.toLowerCase().includes('battle') || map.mode.includes('大逃杀'))
  const classCounts = legends.items.reduce<Record<string, number>>((acc, legend) => {
    acc[legend.class] = (acc[legend.class] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">FIELD MANUAL / {dataSnapshot.season.toUpperCase()}</span>
          <h1><span>作战资料，</span><br /><span>先于枪声抵达。</span></h1>
          <p>第 {season.season} 赛季 {season.name} 已上线。这里整理当前英雄天赋、枪械、腐化配件、地图与 EA 官方规则，每条数据保留来源与核验时间。</p>
          <div className="hero-actions">
            <Link className="action-primary" to="/season">查看 30.0 改动 <span>→</span></Link>
            <Link className="action-secondary" to="/legends">英雄与护甲天赋</Link>
          </div>
        </div>
        <div className="hero-intel" style={lead?.image ? { backgroundImage: `url("${lead.image}")` } : undefined}>
          <div className="hero-intel-number">{dataSnapshot.season.replace(/\D/g, '').padStart(2, '0')}</div>
          <div className="hero-intel-copy">
            <span>LATEST OFFICIAL INTEL</span>
            <h2>{lead?.titleZh ?? lead?.title ?? '官方情报正在同步'}</h2>
            {lead && <a href={lead.url} target="_blank" rel="noreferrer">EA 原文 · {formatDate(lead.date)} ↗</a>}
          </div>
        </div>
      </section>

      <Link className="season-command-strip" to="/season">
        <span>LIVE / PATCH {season.patch}</span>
        <strong>{attachments.items.length} 种腐化配件 · {dataSnapshot.counts.upgrades} 项护甲天赋 · 世界尽头夜间重制</strong>
        <b>打开赛季作战简报 ↗</b>
      </Link>

      <section className="database-index" aria-label="资料库入口">
        {databaseLinks.map((item, index) => (
          <Link to={item.to} className="index-record" key={item.to}>
            <span className="index-number">0{index + 1}</span>
            <span className="index-code">{item.code}</span>
            <strong>{item.label}</strong>
            <b>{item.count()}</b>
            <span className="index-arrow">↗</span>
          </Link>
        ))}
      </section>

      <section className="home-grid">
        <article className="integrity-panel">
          <header>
            <div><span className="eyebrow">DATA INTEGRITY</span><h2>完整性检查</h2></div>
            <Link to="/sources">查看来源与许可 →</Link>
          </header>
          <div className="integrity-stats">
            <div><span>英雄</span><b>{legends.items.length}</b><small>应收录 28</small></div>
            <div><span>护甲天赋</span><b>{dataSnapshot.counts.upgrades}</b><small>28 位英雄 × 4 项</small></div>
            <div><span>枪械</span><b>{weapons.items.length}</b><small>7 个分类</small></div>
            <div><span>核验时间</span><b className="date-value">{formatVerifiedAt(dataSnapshot.verifiedAt)}</b><small>静态快照</small></div>
          </div>
          <div className="class-distribution">
            {Object.entries(classCounts).map(([name, count]) => (
              <div key={name}><span>{name}</span><i style={{ '--fill': `${(count / Math.max(1, legends.items.length)) * 100}%` } as React.CSSProperties} /><b>{count}</b></div>
            ))}
          </div>
        </article>

        <aside className="map-roster">
          <header><span className="eyebrow">BATTLE ROYALE</span><h2>大逃杀地图</h2></header>
          <div>
            {currentBattleRoyaleMaps.slice(0, 6).map((map, index) => (
              <Link to={`/maps?map=${map.id}`} key={map.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{map.nameZh || map.name}</strong>
                <small>{map.status}</small>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="home-news">
        <header className="section-title"><div><span className="eyebrow">OFFICIAL FEED</span><h2>近期官方情报</h2></div><Link to="/news">全部新闻 →</Link></header>
        <div className="news-rail">
          {news.items.slice(0, 4).map((item, index) => (
            <a href={item.url} target="_blank" rel="noreferrer" key={item.id} className="news-rail-item">
              <span className="news-rail-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="news-date">{formatDate(item.date)}</span>
              <h3>{item.titleZh ?? item.title}</h3>
              <p>{item.summaryZh ?? item.summary}</p>
              <span className="news-rail-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
