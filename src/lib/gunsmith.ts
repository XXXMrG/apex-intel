import type { Weapon, WeaponDamage, WeaponDamageMode } from '../types'

export type HelmetTierId = 'none' | 'white' | 'blue' | 'purple'

export interface HelmetTier {
  id: HelmetTierId
  nameZh: string
  reduction: number
}

export interface HealthTier {
  health: number
  nameZh: string
  armorZh: string
}

export const helmetTiers: HelmetTier[] = [
  { id: 'none', nameZh: '无头盔', reduction: 0 },
  { id: 'white', nameZh: '白头盔', reduction: 0.2 },
  { id: 'blue', nameZh: '蓝头盔', reduction: 0.5 },
  { id: 'purple', nameZh: '紫／金头盔', reduction: 0.65 },
]

export const healthTiers: HealthTier[] = [
  { health: 100, nameZh: '纯生命', armorZh: '无护甲' },
  { health: 150, nameZh: '白甲目标', armorZh: '50 护盾' },
  { health: 175, nameZh: '蓝甲目标', armorZh: '75 护盾' },
  { health: 200, nameZh: '紫甲目标', armorZh: '100 护盾' },
  { health: 225, nameZh: '红甲目标', armorZh: '125 护盾' },
]

export interface MagazineResult {
  value: number | null
  status: 'verified' | 'derived' | 'unavailable'
  noteZh: string
}

export interface BuildMetrics {
  damage: { body: number | null; head: number | null; legs: number | null }
  helmetHeadDamage: number | null
  magazine: MagazineResult
  rpm: number | null
  bodyDps: number | null
  bodyDamagePerMagazine: number | null
  headDamagePerMagazine: number | null
}

export interface CombatRow {
  health: number
  nameZh: string
  armorZh: string
  bodyShots: number | null
  headShots: number | null
  legShots: number | null
  bodyTtkMs: number | null
  headTtkMs: number | null
}

export function toDamageNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const pelletMatch = value.trim().match(/^(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+)$/i)
  if (pelletMatch) return Number(pelletMatch[1]) * Number(pelletMatch[2])
  if (/^\d+(?:\.\d+)?$/.test(value.trim())) return Number(value)
  return null
}

export function getDamageMode(weapon: Weapon, modeId: string): WeaponDamage | WeaponDamageMode {
  return weapon.damageModes?.find((mode) => mode.id === modeId) ?? weapon.damage
}

export function getMagazineResult(weapon: Weapon, magazineIndex: number, corruptedAttachmentId: string): MagazineResult {
  const sizes = weapon.magazineSizes ?? []
  const selected = toDamageNumber(sizes[Math.min(Math.max(magazineIndex, 0), Math.max(sizes.length - 1, 0))])

  if (corruptedAttachmentId === 'overflowing-magazine') {
    const exact = toDamageNumber(weapon.corruptedMagazineSize)
    if (exact != null) {
      return { value: exact, status: 'verified', noteZh: 'Season 30 游戏内该武器属性卡实测值' }
    }
    return { value: null, status: 'unavailable', noteZh: '确认高于紫色弹匣；该枪精确容量尚无可审计属性卡' }
  }

  if (selected == null) {
    return { value: null, status: 'unavailable', noteZh: '当前快照没有可计算的单一弹匣容量' }
  }

  if (corruptedAttachmentId === 'agile-standard-stock') {
    if (weapon.id === 'r-99-smg') {
      return { value: Math.max(1, selected - 5), status: 'verified', noteZh: 'R-99 游戏内属性卡：弹匣容量 -5' }
    }
    return { value: null, status: 'unavailable', noteZh: '确认会减容；该枪减容值尚无可审计属性卡' }
  }

  if (corruptedAttachmentId === 'rapid-sniper-stock') {
    if (weapon.id === 'triple-take') {
      return { value: Math.max(1, selected - 1), status: 'verified', noteZh: 'Triple Take 官方属性卡：弹匣容量 -1' }
    }
    return { value: null, status: 'unavailable', noteZh: '确认会减容；该枪减容值尚无可审计属性卡' }
  }

  return {
    value: selected,
    status: 'verified',
    noteZh: weapon.supplyDrop ? '空投固定弹仓' : '当前赛季武器快照',
  }
}

export function applyHelmet(bodyDamage: number, headDamage: number, reduction: number): number {
  const headshotBonus = Math.max(0, headDamage - bodyDamage)
  return Math.round(bodyDamage + headshotBonus * (1 - reduction))
}

export function shotsToKill(health: number, damage: number | null): number | null {
  if (damage == null || damage <= 0) return null
  return Math.ceil(health / damage)
}

export function theoreticalTtkMs(shots: number | null, rpm: number | null): number | null {
  if (shots == null || rpm == null || rpm <= 0) return null
  return Math.max(0, (shots - 1) * 60_000 / rpm)
}

export function calculateBuildMetrics(
  weapon: Weapon,
  modeId: string,
  magazineIndex: number,
  corruptedAttachmentId: string,
  helmetTierId: HelmetTierId,
): BuildMetrics {
  const mode = getDamageMode(weapon, modeId)
  const body = toDamageNumber(mode.body)
  let head = toDamageNumber(mode.head)
  const legs = toDamageNumber(mode.legs)

  if (head != null && corruptedAttachmentId === 'headseeker-barrel') head += 3

  const helmet = helmetTiers.find((item) => item.id === helmetTierId) ?? helmetTiers[0]
  const helmetHeadDamage = body != null && head != null ? applyHelmet(body, head, helmet.reduction) : null
  const magazine = getMagazineResult(weapon, magazineIndex, corruptedAttachmentId)
  const rpm = typeof weapon.rpm === 'number' ? weapon.rpm : null

  return {
    damage: { body, head, legs },
    helmetHeadDamage,
    magazine,
    rpm,
    bodyDps: body != null && rpm != null ? body * rpm / 60 : null,
    bodyDamagePerMagazine: body != null && magazine.value != null ? body * magazine.value : null,
    headDamagePerMagazine: helmetHeadDamage != null && magazine.value != null ? helmetHeadDamage * magazine.value : null,
  }
}

export function buildCombatRows(metrics: BuildMetrics): CombatRow[] {
  return healthTiers.map((tier) => {
    const bodyShots = shotsToKill(tier.health, metrics.damage.body)
    const headShots = shotsToKill(tier.health, metrics.helmetHeadDamage)
    return {
      ...tier,
      bodyShots,
      headShots,
      legShots: shotsToKill(tier.health, metrics.damage.legs),
      bodyTtkMs: theoreticalTtkMs(bodyShots, metrics.rpm),
      headTtkMs: theoreticalTtkMs(headShots, metrics.rpm),
    }
  })
}

export function formatMetric(value: number | null, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
