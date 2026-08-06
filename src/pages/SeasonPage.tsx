import { Link } from '../components/AppLink'
import { PageHeader } from '../components/Common'
import { attachments, season, weapons } from '../data'

const sourceFor = (key: string) => season.officialSources.find((source) => source.title.toLowerCase().includes(key === 'updates' ? 'game updates' : key)) ?? season.officialSources[0]

export function SeasonPage() {
  const weaponById = new Map(weapons.items.map((weapon) => [weapon.id, weapon]))

  return (
    <div className="season-page database-page">
      <PageHeader
        eyebrow={`LIVE PATCH / ${season.patch}`}
        title={`第 ${season.season} 赛季 · ${season.name}`}
        description="截至 2026-08-06 已正式上线的 30.0 静态快照。规则与平衡以 EA／Respawn 官方补丁为准；配件精确属性卡单独标注证据等级。"
        meta={<span className="heading-meta">LIVE {season.liveAt} · {season.highlights.length} VERIFIED CHANGE GROUPS</span>}
      />

      <section className="season-status" aria-label="赛季状态">
        <div><span>STATUS</span><b>正式上线</b></div>
        <div><span>PATCH</span><b>{season.patch}</b></div>
        <div><span>LIVE</span><b>{season.liveAt}</b></div>
        <div><span>VERIFIED</span><b>{season.verifiedAt}</b></div>
      </section>

      <section className="season-highlights">
        {season.highlights.map((item, index) => {
          const source = sourceFor(item.sourceKey)
          return (
            <article key={item.id} className={`season-highlight season-highlight-${index + 1}`}>
              <header><span>{String(index + 1).padStart(2, '0')}</span><small>{item.id.toUpperCase()}</small></header>
              <h2>{item.titleZh}</h2>
              <p>{item.summaryZh}</p>
              <ul>{item.factsZh.map((fact) => <li key={fact}>{fact}</li>)}</ul>
              <a href={source.url} target="_blank" rel="noreferrer">EA 官方来源 ↗</a>
            </article>
          )
        })}
      </section>

      <section className="corrupted-section" id="corrupted-attachments">
        <header className="section-title">
          <div><span className="eyebrow">RISK / REWARD / ONE PER WEAPON</span><h2>腐化配件</h2></div>
          <p>{attachments.items.length} 件 · 红色神话稀有度</p>
        </header>
        <div className="translation-policy">
          <b>中文名口径</b>
          <p>{attachments.translationPolicy.statusZh}</p>
          <span>同义候选：{attachments.translationPolicy.aliasesZh.join(' / ')}</span>
        </div>
        <div className="corrupted-grid">
          {attachments.items.map((attachment, index) => (
            <article className="corrupted-card" key={attachment.id}>
              <header><span>RED / {String(index + 1).padStart(2, '0')}</span><small>{attachment.slotZh}</small></header>
              <h3>{attachment.nameZh}</h3>
              <b>{attachment.name}</b>
              <div className="tradeoff-grid">
                <div><span>收益</span><p>{attachment.buffZh}</p></div>
                <div><span>代价</span><p>{attachment.drawbackZh}</p></div>
              </div>
              {attachment.verifiedExamples.map((example) => (
                <section className="attachment-example" key={`${attachment.id}-${example.weaponId ?? 'card'}`}>
                  <div>
                    <span>实机卡示例</span>
                    <strong>{example.weaponId ? weaponById.get(example.weaponId)?.nameZh ?? example.weaponId : '当前武器未可靠识别'}</strong>
                  </div>
                  <dl>{example.stats.map((stat) => <div key={`${stat.labelZh}-${stat.delta}`}><dt>{stat.labelZh}</dt><dd>{stat.delta}</dd>{stat.result && <small>{stat.result}</small>}</div>)}</dl>
                  <small>{example.evidence}</small>
                </section>
              ))}
              <details>
                <summary>兼容武器 · {attachment.compatibleWeaponIds.length}</summary>
                <p>{attachment.compatibilityBasisZh}</p>
                <div>{attachment.compatibleWeaponIds.map((id) => <span key={id}>{weaponById.get(id)?.nameZh ?? id}</span>)}</div>
              </details>
            </article>
          ))}
        </div>
        <footer className="corrupted-footer">
          <div><span>装备限制</span><b>每把武器最多 1 件</b></div>
          <div><span>刷新位置</span><b>{attachments.items[0]?.availabilityZh.join(' / ')}</b></div>
          <Link to="/weapons">进入枪械数据库 →</Link>
        </footer>
      </section>

      <section className="official-source-band">
        <span className="eyebrow">PRIMARY SOURCES</span>
        <div>{season.officialSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>
      </section>
    </div>
  )
}
