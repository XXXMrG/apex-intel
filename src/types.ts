export type LegendClass = 'Assault' | 'Skirmisher' | 'Recon' | 'Support' | 'Controller'
export type AbilityType = 'passive' | 'tactical' | 'ultimate'

export interface SourceRef {
  name?: string
  title?: string
  url: string
  revision?: string | number | null
  fetchedAt?: string
  publishedAt?: string
  verifiedAt?: string
  license?: string
}

export interface SeasonOverrideRef extends SourceRef {
  patch: string
  fields: string[]
  noteZh: string
}

export interface MediaAsset {
  src: string
  sourceFile: string
  sourceUrl: string
  sourceSha1: string
  localSha256: string
  width: number
  height: number
  rights: string
}

export interface Ability {
  id: string
  type: AbilityType
  name: string
  description: string
  descriptionZh?: string
  cooldown?: string | null
  media?: MediaAsset
}

export interface LegendUpgradeOption {
  id: string
  branch: 'A' | 'B'
  name: string
  nameZh?: string | null
  description: string
  descriptionZh?: string | null
}

export interface LegendUpgradeTier {
  armorLevel: 2 | 3
  armorTier: 'blue' | 'purple'
  options: LegendUpgradeOption[]
}

export interface Legend {
  id: string
  name: string
  nameZh?: string | null
  aliasesZh?: string[]
  title?: string | null
  class: LegendClass
  releaseDate?: string | null
  description: string
  descriptionZh?: string
  abilities: Ability[]
  upgrades?: LegendUpgradeTier[]
  upgradeSource?: SourceRef
  seasonOverride?: SeasonOverrideRef
  media?: MediaAsset
  source: SourceRef
}

export interface WeaponDamage {
  body: number | string | null
  head: number | string | null
  legs: number | string | null
}

export interface Weapon {
  id: string
  name: string
  nameZh?: string | null
  aliasesZh?: string[]
  category: string
  ammo: string
  ammoZh?: string | null
  fireModes: string[]
  damage: WeaponDamage
  bodyDamage?: number | string | null
  headDamage?: number | string | null
  legDamage?: number | string | null
  rpm?: number | string | null
  magazineSizes?: Array<number | string> | null
  corruptedMagazineSize?: number | string | null
  stockpileSize?: number | null
  lootStatus?: string | null
  currentLootTier?: string | null
  supplyDrop?: boolean
  attachments: string[]
  attachmentsZh?: string[]
  corruptedAttachmentIds?: string[]
  description: string
  descriptionZh?: string
  media?: MediaAsset
  seasonOverride?: SeasonOverrideRef
  source: SourceRef
}

export interface MapRecord {
  id: string
  name: string
  nameZh?: string | null
  aliasesZh?: string[]
  mode: string
  modeZh?: string | null
  status: string
  releaseDate?: string | null
  description: string
  descriptionZh?: string
  media?: MediaAsset
  seasonOverride?: SeasonOverrideRef
  source: SourceRef
}

export interface AttachmentStat {
  labelZh: string
  delta: string
  result?: string
}

export interface AttachmentExample {
  weaponId: string | null
  stats: AttachmentStat[]
  evidence: string
}

export interface CorruptedAttachment {
  id: string
  name: string
  nameZh: string
  aliasesZh: string[]
  slot: string
  slotZh: string
  rarity: string
  rarityZh: string
  limitPerWeapon: number
  availabilityZh: string[]
  buffZh: string
  drawbackZh: string
  compatibilityBasisZh: string
  compatibleWeaponIds: string[]
  verifiedExamples: AttachmentExample[]
  source: SourceRef
}

export interface NewsItem {
  id: string
  title: string
  titleZh?: string
  date: string
  category: string
  summary: string
  summaryZh?: string
  url: string
  image?: string | null
  tags?: string[]
  source?: SourceRef
}

export interface DatasetMeta {
  gameVersion: string
  fetchedAt: string
  sourceName: string
  sourceUrl: string
  license: string
  count: number
  totalAvailable?: number
}

export interface Dataset<T> {
  meta: DatasetMeta
  items: T[]
}

export interface SeasonHighlight {
  id: string
  titleZh: string
  summaryZh: string
  factsZh: string[]
  sourceKey: string
}

export interface SeasonRecord {
  meta: DatasetMeta
  season: number
  name: string
  nameZh: string
  status: 'live' | 'announced' | 'archived'
  patch: string
  officialPublishedAt: string
  liveAt: string
  verifiedAt: string
  officialSources: Array<{ title: string; url: string }>
  highlights: SeasonHighlight[]
}
