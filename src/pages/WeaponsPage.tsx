import { useEffect, useMemo, useState } from 'react'
import { DatabaseToolbar, EmptyState, PageHeader } from '../components/Common'
import { DetailDrawer } from '../components/DetailDrawer'
import { attachmentMedia, attachments, weapons } from '../data'
import type { Weapon } from '../types'
import { matchesSearch } from '../utils'

const categories = ['全部', 'AR', 'SMG', 'LMG', 'Marksman', 'Sniper', 'Shotgun', 'Pistol']
const categoryLabels: Record<string, string> = {
  AR: '突击步枪',
  SMG: '冲锋枪',
  LMG: '轻机枪',
  Marksman: '射手武器',
  Sniper: '狙击枪',
  Shotgun: '霰弹枪',
  Pistol: '手枪',
}

const renderValue = (value: number | string | null | undefined) => value ?? '—'

export function WeaponsPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
  const corruptedById = useMemo(() => new Map(attachments.items.map((item) => [item.id, item])), [])

  const filtered = useMemo(() => weapons.items.filter((weapon) => {
    const categoryMatch = selectedCategory === '全部' || weapon.category === selectedCategory
    return categoryMatch && matchesSearch([
      weapon.name,
      weapon.nameZh,
      ...(weapon.aliasesZh ?? []),
      weapon.category,
      weapon.ammo,
      weapon.ammoZh,
      weapon.description,
      weapon.descriptionZh,
      weapon.lootStatus,
      ...weapon.fireModes,
      ...weapon.attachments,
      ...(weapon.attachmentsZh ?? []),
      ...(weapon.corruptedAttachmentIds ?? []).flatMap((id) => {
        const attachment = corruptedById.get(id)
        return attachment ? [attachment.name, attachment.nameZh, ...attachment.aliasesZh] : []
      }),
    ], query)
  }), [corruptedById, query, selectedCategory])

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedWeapon(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return (
    <div className="database-page">
      <PageHeader
        eyebrow="ARMORY / CURRENT WEAPON CATALOG"
        title="枪械数据库"
        description="覆盖当前全部七类武器。伤害、射速、弹匣与配件字段仅展示已核实的当前赛季数据。"
        meta={<span className="heading-meta">{weapons.items.length} WEAPONS · 7 CLASSES</span>}
      />
      <DatabaseToolbar
        query={query}
        onQueryChange={setQuery}
        queryLabel="搜索武器、弹药或配件"
        options={categories}
        selected={selectedCategory}
        onSelectedChange={setSelectedCategory}
        resultCount={filtered.length}
      />

      {filtered.length ? (
        <section className="record-grid weapon-grid" aria-live="polite">
          {filtered.map((weapon, index) => (
            <button className="record-card weapon-card" key={weapon.id} type="button" onClick={() => setSelectedWeapon(weapon)}>
              <div className="weapon-card-head">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>{categoryLabels[weapon.category] ?? weapon.category}</small>
              </div>
              <div className="weapon-silhouette">
                {weapon.media && <img src={weapon.media.src} alt="" loading="lazy" decoding="async" />}
              </div>
              <div className="record-copy">
                <span>{weapon.ammoZh || weapon.ammo}</span>
                <h2>{weapon.nameZh || weapon.name}</h2>
                {weapon.nameZh && <p>{weapon.name}</p>}
                <dl className="weapon-quick-stats">
                  <div><dt>躯干</dt><dd>{renderValue(weapon.damage.body)}</dd></div>
                  <div><dt>射速</dt><dd>{renderValue(weapon.rpm)}</dd></div>
                  <div><dt>状态</dt><dd>{weapon.lootStatus || '地面战利品'}</dd></div>
                </dl>
              </div>
              <span className="record-open">↗</span>
            </button>
          ))}
        </section>
      ) : <EmptyState />}

      <DetailDrawer
        open={Boolean(selectedWeapon)}
        onClose={() => setSelectedWeapon(null)}
        eyebrow={selectedWeapon ? selectedWeapon.category.toUpperCase() : 'WEAPON'}
        title={selectedWeapon ? `${selectedWeapon.nameZh ? `${selectedWeapon.nameZh} / ` : ''}${selectedWeapon.name}` : ''}
        subtitle={selectedWeapon?.descriptionZh ?? selectedWeapon?.description}
        sourceUrl={selectedWeapon?.source.url}
      >
        {selectedWeapon && (
          <>
            {selectedWeapon.media && (
              <figure className="drawer-visual weapon-drawer-visual">
                <img src={selectedWeapon.media.src} alt={`${selectedWeapon.nameZh || selectedWeapon.name}武器资料图`} />
                <a href={selectedWeapon.media.sourceUrl} target="_blank" rel="noreferrer">查看图片来源 ↗</a>
              </figure>
            )}
            <dl className="fact-line weapon-facts">
              <div><dt>弹药</dt><dd>{selectedWeapon.ammoZh || selectedWeapon.ammo}</dd></div>
              <div><dt>射击模式</dt><dd>{selectedWeapon.fireModes.join(' / ') || '—'}</dd></div>
              <div><dt>战利品状态</dt><dd>{selectedWeapon.lootStatus || '地面战利品'}</dd></div>
            </dl>
            <section className="damage-table" aria-label="伤害数据">
              <header><span>DAMAGE PROFILE</span><strong>{weapons.meta.gameVersion}</strong></header>
              <div><span>头部</span><b>{renderValue(selectedWeapon.damage.head)}</b></div>
              <div><span>躯干</span><b>{renderValue(selectedWeapon.damage.body)}</b></div>
              <div><span>腿部</span><b>{renderValue(selectedWeapon.damage.legs)}</b></div>
              <div><span>射速</span><b>{renderValue(selectedWeapon.rpm)}</b><small>RPM</small></div>
            </section>
            <section className="drawer-section">
              <h3>弹匣容量</h3>
              <div className="value-chips">{selectedWeapon.magazineSizes?.length ? selectedWeapon.magazineSizes.map((size, index) => <span key={`${size}-${index}`}>{size}</span>) : <span>来源未提供</span>}</div>
              {selectedWeapon.corruptedMagazineSize && <p className="corrupted-mag-note">腐化红弹匣：{selectedWeapon.corruptedMagazineSize} 发</p>}
            </section>
            <section className="drawer-section">
              <h3>可用配件</h3>
              <div className="attachment-list">
                {selectedWeapon.attachments.length
                  ? selectedWeapon.attachments.map((item, index) => (
                    <span key={item}>
                      {attachmentMedia[item] && <img src={attachmentMedia[item].src} alt="" loading="lazy" />}
                      {selectedWeapon.attachmentsZh?.[index] ?? item}
                    </span>
                  ))
                  : <span>来源未提供</span>}
              </div>
            </section>
            <section className="drawer-section compatible-corrupted">
              <h3>兼容腐化配件</h3>
              {selectedWeapon.corruptedAttachmentIds?.length ? (
                <div>
                  {selectedWeapon.corruptedAttachmentIds.map((id) => {
                    const attachment = corruptedById.get(id)
                    if (!attachment) return null
                    return (
                      <article key={id}>
                        <span>{attachment.slotZh}</span>
                        <h4>{attachment.nameZh}</h4>
                        <p><b>收益</b>{attachment.buffZh}</p>
                        <p><b>代价</b>{attachment.drawbackZh}</p>
                      </article>
                    )
                  })}
                </div>
              ) : <p className="drawer-note">当前武器不接受地面腐化配件，或属于预装配件的空投武器。</p>}
            </section>
          </>
        )}
      </DetailDrawer>
    </div>
  )
}
