export type LegendClass = 'Assault' | 'Skirmisher' | 'Recon' | 'Support' | 'Controller'
export type AbilityType = 'passive' | 'tactical' | 'ultimate'

export interface SourceRef {
  name?: string
  title?: string
  url: string
  revision?: string | number | null
  fetchedAt?: string
  license?: string
}

export interface Ability {
  id: string
  type: AbilityType
  name: string
  description: string
  descriptionZh?: string
  cooldown?: string | null
}

export interface Legend {
  id: string
  name: string
  nameZh?: string | null
  title?: string | null
  class: LegendClass
  releaseDate?: string | null
  description: string
  descriptionZh?: string
  abilities: Ability[]
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
  category: string
  ammo: string
  fireModes: string[]
  damage: WeaponDamage
  bodyDamage?: number | string | null
  headDamage?: number | string | null
  legDamage?: number | string | null
  rpm?: number | string | null
  magazineSizes?: Array<number | string> | null
  lootStatus?: string | null
  currentLootTier?: string | null
  supplyDrop?: boolean
  attachments: string[]
  description: string
  descriptionZh?: string
  source: SourceRef
}

export interface MapRecord {
  id: string
  name: string
  nameZh?: string | null
  mode: string
  status: string
  releaseDate?: string | null
  description: string
  descriptionZh?: string
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
