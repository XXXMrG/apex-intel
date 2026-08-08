import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { attachments, season, weapons } from '../data'
import {
  buildCombatRows,
  calculateBuildMetrics,
  formatMetric,
  getDamageMode,
  helmetTiers,
  type HelmetTierId,
} from '../lib/gunsmith'
import type { CorruptedAttachment, Weapon } from '../types'

const categoryNames: Record<string, string> = {
  AR: '突击步枪',
  SMG: '冲锋枪',
  LMG: '轻机枪',
  Marksman: '射手武器',
  Sniper: '狙击枪',
  Shotgun: '霰弹枪',
  Pistol: '手枪',
}

const magazineLabels = ['基础', '白', '蓝', '紫', '金']
const normalTierLabels = ['无', '白', '蓝', '紫']
const optics = ['机瞄', '1× HCOG', '1× 全息', '1×–2×', '2× HCOG', '3× HCOG', '2×–4×']

function weaponSearchText(weapon: Weapon) {
  return [weapon.name, weapon.nameZh, ...(weapon.aliasesZh ?? []), weapon.ammo, weapon.ammoZh, categoryNames[weapon.category]]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function hasAttachment(weapon: Weapon, names: string[]) {
  return weapon.attachments.some((attachment) => names.includes(attachment))
}

function formatTtk(value: number | null) {
  return value == null ? '—' : `${Math.round(value)} ms`
}

function deltaClass(delta: string) {
  return delta.trim().startsWith('-') ? 'is-negative' : 'is-positive'
}

export function GunsmithPage() {
  const [selectedWeaponId, setSelectedWeaponId] = useState('r-99-smg')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [magazineIndex, setMagazineIndex] = useState(3)
  const [muzzleTier, setMuzzleTier] = useState(3)
  const [stockTier, setStockTier] = useState(3)
  const [optic, setOptic] = useState('2× HCOG')
  const [corruptedAttachmentId, setCorruptedAttachmentId] = useState('')
  const [helmetTierId, setHelmetTierId] = useState<HelmetTierId>('purple')
  const [damageModeId, setDamageModeId] = useState('standard')

  const selectedWeapon = weapons.items.find((weapon) => weapon.id === selectedWeaponId) ?? weapons.items[0]
  const selectedMode = getDamageMode(selectedWeapon, damageModeId)
  const compatibleCorrupted = attachments.items.filter((attachment) => attachment.compatibleWeaponIds.includes(selectedWeapon.id))
  const selectedCorrupted = attachments.items.find((attachment) => attachment.id === corruptedAttachmentId) ?? null

  const filteredWeapons = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return weapons.items.filter((weapon) => {
      const categoryMatch = category === '全部' || weapon.category === category
      const queryMatch = !normalized || weaponSearchText(weapon).includes(normalized)
      return categoryMatch && queryMatch
    })
  }, [category, query])

  const metrics = calculateBuildMetrics(selectedWeapon, damageModeId, magazineIndex, corruptedAttachmentId, helmetTierId)
  const combatRows = buildCombatRows(metrics)
  const helmet = helmetTiers.find((item) => item.id === helmetTierId) ?? helmetTiers[0]
  const magazineSizes = selectedWeapon.magazineSizes ?? []
  const hasMuzzle = hasAttachment(selectedWeapon, ['Barrel Stabilizer', 'Laser Sight'])
  const muzzleName = hasAttachment(selectedWeapon, ['Laser Sight']) ? '激光瞄准器' : '枪管稳定器'
  const hasStock = hasAttachment(selectedWeapon, ['Standard Stock', 'Sniper Stock'])
  const stockName = hasAttachment(selectedWeapon, ['Sniper Stock']) ? '狙击枪托' : '标准枪托'
  const hasOptics = hasAttachment(selectedWeapon, ['Optics'])
  const selectedExample = selectedCorrupted?.verifiedExamples.find((example) => example.weaponId === selectedWeapon.id)
    ?? selectedCorrupted?.verifiedExamples.find((example) => example.weaponId == null)
  const exampleApplies = Boolean(selectedExample && (selectedExample.weaponId === selectedWeapon.id || selectedExample.weaponId == null))

  function chooseWeapon(weapon: Weapon) {
    setSelectedWeaponId(weapon.id)
    setMagazineIndex(Math.max(0, (weapon.magazineSizes?.length ?? 1) - 1))
    setMuzzleTier(3)
    setStockTier(3)
    setOptic('2× HCOG')
    setCorruptedAttachmentId('')
    setDamageModeId(weapon.damageModes?.[0]?.id ?? 'standard')
  }

  function applyPreset(preset: 'bare' | 'purple') {
    setMagazineIndex(preset === 'bare' ? 0 : Math.max(0, magazineSizes.length - 1))
    setMuzzleTier(preset === 'bare' ? 0 : 3)
    setStockTier(preset === 'bare' ? 0 : 3)
    setOptic(preset === 'bare' ? '机瞄' : '2× HCOG')
    setCorruptedAttachmentId('')
  }

  function toggleCorrupted(attachment: CorruptedAttachment) {
    setCorruptedAttachmentId((current) => current === attachment.id ? '' : attachment.id)
  }

  return (
    <section className="gunsmith-page">
      <header className="gunsmith-hero">
        <div>
          <span className="eyebrow">S30 · PLAYGROUND</span>
          <h1>枪械<br /><em>实验台</em></h1>
        </div>
        <div className="gunsmith-hero-copy">
          <p>选枪、装配、切换伤害模式，实时查看部位伤害、弹匣总伤、击杀枪数与理论 TTK。腐化红配件严格执行“一把枪只能装一个”。</p>
          <div>
            <span><b>29</b> 把武器</span>
            <span><b>5</b> 个腐化模块</span>
            <span><b>30.0</b> 数据口径</span>
          </div>
          <a href={season.officialSources[0].url} target="_blank" rel="noreferrer">查看 EA 30.0 官方补丁 ↗</a>
        </div>
      </header>

      <div className="gunsmith-integrity-bar">
        <span><i /> LIVE SNAPSHOT</span>
        <p><b>官方直出</b>：身体伤害、弹匣改动、腐化配件规则　/　<b>公式衍生</b>：爆头与腿部伤害、击杀枪数、TTK</p>
        <time>核验 2026-08-08</time>
      </div>

      <div className="gunsmith-workbench">
        <aside className="weapon-picker" aria-label="选择武器">
          <div className="workbench-title">
            <span>01 / WEAPON</span>
            <b>{filteredWeapons.length.toString().padStart(2, '0')}</b>
          </div>
          <label className="weapon-picker-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索武器 / 别名" />
          </label>
          <div className="weapon-category-tabs" aria-label="武器类型">
            {['全部', 'AR', 'SMG', 'LMG', 'Marksman', 'Sniper', 'Shotgun', 'Pistol'].map((item) => (
              <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>
                {item === '全部' ? item : categoryNames[item]}
              </button>
            ))}
          </div>
          <div className="weapon-picker-list">
            {filteredWeapons.map((weapon, index) => (
              <button
                type="button"
                key={weapon.id}
                className={selectedWeapon.id === weapon.id ? 'is-active' : ''}
                onClick={() => chooseWeapon(weapon)}
                aria-pressed={selectedWeapon.id === weapon.id}
              >
                <span>{(index + 1).toString().padStart(2, '0')}</span>
                {weapon.media && <img src={weapon.media.src} alt="" />}
                <div>
                  <strong>{weapon.nameZh ?? weapon.name}</strong>
                  <small>{weapon.name}</small>
                </div>
                {weapon.seasonOverride && <i>S30</i>}
              </button>
            ))}
          </div>
        </aside>

        <div className="weapon-stage">
          <div className="weapon-stage-topline">
            <span>{categoryNames[selectedWeapon.category]} / {selectedWeapon.ammoZh ?? selectedWeapon.ammo}</span>
            <b className={selectedWeapon.supplyDrop ? 'is-supply' : ''}>{selectedWeapon.supplyDrop ? '空投武器' : '地面战利品'}</b>
          </div>
          <div className="weapon-stage-name">
            <span>SELECTED PLATFORM</span>
            <h2>{selectedWeapon.nameZh ?? selectedWeapon.name}</h2>
            <p>{selectedWeapon.name}</p>
          </div>
          <div className="weapon-stage-art">
            <span className="weapon-stage-index">{String(weapons.items.indexOf(selectedWeapon) + 1).padStart(2, '0')}</span>
            {selectedWeapon.media && <img src={selectedWeapon.media.src} alt={selectedWeapon.nameZh ?? selectedWeapon.name} />}
            <div className="stage-crosshair" aria-hidden="true"><i /><i /></div>
          </div>
          <div className="active-loadout" aria-label="当前装配">
            <span>{optic}</span>
            <span>{magazineSizes.length > 1 ? `${magazineLabels[magazineIndex] ?? '扩容'}弹匣` : '固定弹仓'}</span>
            {selectedWeapon.infiniteReserve && <span>备用弹药 ∞</span>}
            {hasMuzzle && <span>{normalTierLabels[muzzleTier]}{muzzleTier ? muzzleName : '枪口'}</span>}
            {hasStock && <span>{normalTierLabels[stockTier]}{stockTier ? stockName : '枪托'}</span>}
            {selectedCorrupted && <span className="is-corrupted">{selectedCorrupted.nameZh}</span>}
          </div>
          <div className="damage-readout">
            <article>
              <span>身体伤害</span>
              <b>{formatMetric(metrics.damage.body)}</b>
              <small>BASE DAMAGE</small>
            </article>
            <article className="is-head">
              <span>头部伤害</span>
              <b>{formatMetric(metrics.helmetHeadDamage)}</b>
              <small>{helmet.nameZh}{corruptedAttachmentId === 'headseeker-barrel' ? ' · 原始爆头 +3' : ''}</small>
            </article>
            <article>
              <span>腿部伤害</span>
              <b>{formatMetric(metrics.damage.legs)}</b>
              <small>LEG DAMAGE</small>
            </article>
          </div>
          <div className="performance-ribbon">
            <div><span>射速</span><b>{metrics.rpm == null ? '待核验' : `${formatMetric(metrics.rpm)} RPM`}</b></div>
            <div><span>身体 DPS</span><b>{formatMetric(metrics.bodyDps, 1)}</b></div>
            <div><span>当前弹匣</span><b>{metrics.magazine.value == null ? '待核验' : `${metrics.magazine.value} 发`}</b></div>
            <div><span>单匣身体总伤</span><b>{formatMetric(metrics.bodyDamagePerMagazine)}</b></div>
          </div>
          <p className={`metric-provenance is-${metrics.magazine.status}`}>
            <b>{metrics.magazine.status === 'verified' ? '已核验' : metrics.magazine.status === 'derived' ? '公式衍生' : '缺少单枪卡片'}</b>
            {metrics.magazine.noteZh}
          </p>
        </div>

        <aside className="build-console" aria-label="配置配件">
          <div className="workbench-title">
            <span>02 / LOADOUT</span>
            <button type="button" onClick={() => applyPreset('bare')}>裸枪</button>
            <button type="button" onClick={() => applyPreset('purple')}>紫装</button>
          </div>

          {selectedWeapon.damageModes && selectedWeapon.damageModes.length > 1 && (
            <fieldset className="build-group">
              <legend>伤害模式</legend>
              <div className="mode-options">
                {selectedWeapon.damageModes.map((mode) => (
                  <button type="button" key={mode.id} className={damageModeId === mode.id ? 'is-active' : ''} aria-pressed={damageModeId === mode.id} onClick={() => setDamageModeId(mode.id)}>
                    {mode.nameZh}
                  </button>
                ))}
              </div>
              {'noteZh' in selectedMode && selectedMode.noteZh && <small>{selectedMode.noteZh}</small>}
            </fieldset>
          )}

          <fieldset className="build-group" disabled={selectedWeapon.supplyDrop}>
            <legend>扩容弹匣</legend>
            <div className="tier-options">
              {magazineSizes.map((size, index) => (
                <button type="button" key={`${size}-${index}`} className={magazineIndex === index ? 'is-active' : ''} onClick={() => setMagazineIndex(index)}>
                  <span>{magazineSizes.length === 1 ? '固定' : magazineLabels[index] ?? `T${index}`}</span><b>{size}</b>
                </button>
              ))}
            </div>
          </fieldset>

          {hasMuzzle && (
            <fieldset className="build-group" disabled={selectedWeapon.supplyDrop}>
              <legend>{muzzleName}</legend>
              <div className="tier-options">
                {normalTierLabels.map((label, index) => (
                  <button type="button" key={label} className={muzzleTier === index ? 'is-active' : ''} onClick={() => setMuzzleTier(index)}>
                    <span>{label}</span><b>{index ? `${index}级` : '—'}</b>
                  </button>
                ))}
              </div>
              <small>{muzzleName === '激光瞄准器' ? '提高腰射精度；普通品质不改变伤害。' : '降低后坐力；普通品质不改变伤害。'}</small>
            </fieldset>
          )}

          {hasStock && (
            <fieldset className="build-group" disabled={selectedWeapon.supplyDrop}>
              <legend>{stockName}</legend>
              <div className="tier-options">
                {normalTierLabels.map((label, index) => (
                  <button type="button" key={label} className={stockTier === index ? 'is-active' : ''} onClick={() => setStockTier(index)}>
                    <span>{label}</span><b>{index ? `${index}级` : '—'}</b>
                  </button>
                ))}
              </div>
              <small>提高操控与换弹效率；普通品质不改变单发伤害。</small>
            </fieldset>
          )}

          {hasOptics && (
            <fieldset className="build-group" disabled={selectedWeapon.supplyDrop}>
              <legend>瞄准镜</legend>
              <select value={optic} onChange={(event) => setOptic(event.target.value)}>
                {optics.map((item) => <option key={item}>{item}</option>)}
              </select>
            </fieldset>
          )}

          <fieldset className="build-group corrupted-builder" disabled={selectedWeapon.supplyDrop || compatibleCorrupted.length === 0}>
            <legend>腐化红配件 <span>最多 1 个</span></legend>
            {compatibleCorrupted.length ? compatibleCorrupted.map((attachment) => (
              <button
                type="button"
                key={attachment.id}
                className={corruptedAttachmentId === attachment.id ? 'is-active' : ''}
                onClick={() => toggleCorrupted(attachment)}
                aria-pressed={corruptedAttachmentId === attachment.id}
              >
                <span>{attachment.slotZh}</span>
                <strong>{attachment.nameZh}</strong>
                <small>{attachment.buffZh}</small>
              </button>
            )) : <p>该武器没有腐化配件槽位。</p>}
          </fieldset>

          {selectedCorrupted && (
            <div className="corrupted-effect-card">
              <header><span>CORRUPTED EFFECT</span><b>{selectedCorrupted.nameZh}</b></header>
              <p className="buff"><b>收益</b>{selectedCorrupted.buffZh}</p>
              <p className="drawback"><b>代价</b>{selectedCorrupted.drawbackZh}</p>
              {exampleApplies ? (
                <dl>
                  {selectedExample?.stats.map((stat) => (
                    <div key={stat.labelZh}><dt>{stat.labelZh}</dt><dd className={deltaClass(stat.delta)}>{stat.result ?? stat.delta}</dd></div>
                  ))}
                </dl>
              ) : (
                <small>规则已确认；当前没有这把枪的精确属性卡，因此不伪造数值。</small>
              )}
            </div>
          )}
        </aside>
      </div>

      <section className="combat-lab">
        <header className="combat-lab-head">
          <div><span className="eyebrow">03 / DAMAGE LAB</span><h2>击杀效率矩阵</h2></div>
          <label>目标头盔
            <select value={helmetTierId} onChange={(event) => setHelmetTierId(event.target.value as HelmetTierId)}>
              {helmetTiers.map((item) => <option key={item.id} value={item.id}>{item.nameZh}</option>)}
            </select>
          </label>
        </header>
        <div className="combat-table-wrap">
          <table className="combat-table">
            <thead><tr><th>目标</th><th>总生命</th><th>身体</th><th>身体理论 TTK</th><th>头部 · {helmet.nameZh}</th><th>头部理论 TTK</th><th>腿部</th><th>一匣可完成</th></tr></thead>
            <tbody>
              {combatRows.map((row) => (
                <tr key={row.health}>
                  <th><b>{row.nameZh}</b><small>{row.armorZh}</small></th>
                  <td>{row.health}</td>
                  <td><strong>{row.bodyShots == null ? '—' : `${row.bodyShots} 枪`}</strong></td>
                  <td>{formatTtk(row.bodyTtkMs)}</td>
                  <td><strong>{row.headShots == null ? '—' : `${row.headShots} 枪`}</strong></td>
                  <td>{formatTtk(row.headTtkMs)}</td>
                  <td>{row.legShots == null ? '—' : `${row.legShots} 枪`}</td>
                  <td>{row.bodyShots != null && metrics.magazine.value != null ? (row.bodyShots <= metrics.magazine.value ? <span className="can-kill">YES</span> : <span className="cannot-kill">NO</span>) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="combat-lab-notes">
          <p><b>TTK 口径</b> 从第一发命中到最后一发命中，按当前 RPM 理论计算；不计预热、蓄力、爆发间隔、换弹、弹速与命中率。无法确认真实射击节奏的武器显示“—”。</p>
          <p><b>部位口径</b> 最新身体伤害来自 EA 30.0；改动枪械的头／腿数值按未变命中倍率取整。头盔只削减“高于身体伤害的爆头加成”。</p>
        </div>
      </section>

      <section className="gunsmith-sources">
        <div><span className="eyebrow">DATA PROVENANCE</span><h2>这页哪些能信到什么程度</h2></div>
        <article><span>01</span><b>EA 30.0 官方补丁</b><p>6 把改动枪械的身体伤害、弹匣、空投状态；腐化配件规则。</p><a href={season.officialSources[0].url} target="_blank" rel="noreferrer">打开来源 ↗</a></article>
        <article><span>02</span><b>游戏内属性卡</b><p>R-99 与 Triple Take 的部分腐化配件精确增减；只在对应武器上当作精确值。</p><Link href="/season">查看赛季档案 →</Link></article>
        <article><span>03</span><b>公式衍生</b><p>爆头／腿部伤害、头盔后伤害、DPS、每匣伤害、击杀枪数与理论 TTK。</p><Link href="/sources">查看数据总账 →</Link></article>
      </section>
    </section>
  )
}
