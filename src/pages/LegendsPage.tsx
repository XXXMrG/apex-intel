import { useEffect, useMemo, useState } from 'react'
import { DatabaseToolbar, EmptyState, PageHeader } from '../components/Common'
import { DetailDrawer } from '../components/DetailDrawer'
import { legends } from '../data'
import type { Legend } from '../types'
import { classNames, formatDate, initials, matchesSearch } from '../utils'

const classes = ['全部', 'Assault', 'Skirmisher', 'Recon', 'Support', 'Controller']
const classLabels: Record<string, string> = {
  Assault: '突击',
  Skirmisher: '游击',
  Recon: '侦察',
  Support: '支援',
  Controller: '控制',
}
const abilityLabels = { passive: '被动', tactical: '战术', ultimate: '终极' }

export function LegendsPage() {
  const [query, setQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('全部')
  const [selectedLegend, setSelectedLegend] = useState<Legend | null>(null)

  const filtered = useMemo(() => legends.items.filter((legend) => {
    const classMatch = selectedClass === '全部' || legend.class === selectedClass
    const searchMatch = matchesSearch([
      legend.name,
      legend.nameZh,
      legend.title,
      legend.class,
      legend.description,
      legend.descriptionZh,
      ...legend.abilities.flatMap((ability) => [ability.name, ability.description, ability.descriptionZh]),
    ], query)
    return classMatch && searchMatch
  }), [query, selectedClass])

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedLegend(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return (
    <div className="database-page">
      <PageHeader
        eyebrow="LEGEND ARCHIVE / COMPLETE ROSTER"
        title="英雄与技能"
        description="当前可用英雄完整名册。每位英雄收录职业、发布日期与被动、战术、终极三项核心技能。"
        meta={<span className="heading-meta">{legends.items.length} LEGENDS · {legends.items.reduce((n, item) => n + item.abilities.length, 0)} ABILITIES</span>}
      />
      <DatabaseToolbar
        query={query}
        onQueryChange={setQuery}
        queryLabel="搜索英雄、技能或描述"
        options={classes}
        selected={selectedClass}
        onSelectedChange={setSelectedClass}
        resultCount={filtered.length}
      />

      {filtered.length ? (
        <section className="record-grid legend-grid" aria-live="polite">
          {filtered.map((legend, index) => (
            <button className="record-card legend-card" key={legend.id} type="button" onClick={() => setSelectedLegend(legend)}>
              <div className={classNames('record-art', `class-${legend.class.toLowerCase()}`)}>
                <span className="record-order">{String(index + 1).padStart(2, '0')}</span>
                <strong aria-hidden="true">{initials(legend.name)}</strong>
                <span className="record-class">{classLabels[legend.class] ?? legend.class}</span>
              </div>
              <div className="record-copy">
                <span>{legend.name}</span>
                <h2>{legend.nameZh || legend.name}</h2>
                <p>{legend.title || legend.description}</p>
                <div className="ability-pips" aria-label={`${legend.abilities.length} 项技能`}>
                  {legend.abilities.map((ability) => <i key={`${legend.id}-${ability.type}`} title={ability.name} />)}
                </div>
              </div>
              <span className="record-open">↗</span>
            </button>
          ))}
        </section>
      ) : <EmptyState />}

      <DetailDrawer
        open={Boolean(selectedLegend)}
        onClose={() => setSelectedLegend(null)}
        eyebrow={selectedLegend ? `${selectedLegend.class.toUpperCase()} LEGEND` : 'LEGEND'}
        title={selectedLegend ? `${selectedLegend.nameZh ? `${selectedLegend.nameZh} / ` : ''}${selectedLegend.name}` : ''}
        subtitle={selectedLegend?.descriptionZh ?? selectedLegend?.description}
        sourceUrl={selectedLegend?.source.url}
      >
        {selectedLegend && (
          <>
            <dl className="fact-line">
              <div><dt>职业</dt><dd>{classLabels[selectedLegend.class] ?? selectedLegend.class}</dd></div>
              <div><dt>发布日期</dt><dd>{formatDate(selectedLegend.releaseDate)}</dd></div>
              <div><dt>数据版本</dt><dd>{legends.meta.gameVersion}</dd></div>
            </dl>
            <div className="ability-list">
              {selectedLegend.abilities.map((ability, index) => (
                <article key={`${selectedLegend.id}-${ability.type}`}>
                  <div className="ability-index">0{index + 1}</div>
                  <div>
                    <span>{abilityLabels[ability.type]}</span>
                    <h3>{ability.name}</h3>
                    <p>{ability.descriptionZh ?? ability.description}</p>
                    {ability.cooldown && <small>冷却 / 充能：{ability.cooldown}</small>}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </DetailDrawer>
    </div>
  )
}
