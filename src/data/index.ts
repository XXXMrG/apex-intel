import attachmentsJson from './attachments.json'
import legendsJson from './legends.json'
import mapsJson from './maps.json'
import mediaJson from './media-manifest.json'
import newsJson from './news.json'
import seasonJson from './season.json'
import weaponsJson from './weapons.json'
import legendTranslationsJson from './translations-legends.zh-CN.json'
import mapTranslationsJson from './translations-maps.zh-CN.json'
import newsTranslationsJson from './translations-news.zh-CN.json'
import weaponTranslationsJson from './translations-weapons.zh-CN.json'
import type { CorruptedAttachment, Dataset, Legend, MapRecord, MediaAsset, NewsItem, SeasonRecord, Weapon } from '../types'

type LegendTranslation = { descriptionZh: string; abilities: Record<string, string> }
type DescriptionTranslation = { descriptionZh: string; nameZh?: string; aliasesZh?: string[] }
type NewsTranslation = { titleZh: string; summaryZh: string }
type MediaManifest = {
  legends: Record<string, MediaAsset>
  abilities: Record<string, MediaAsset>
  weapons: Record<string, MediaAsset>
  maps: Record<string, MediaAsset>
  attachments: Record<string, MediaAsset>
}

const legendTranslations = legendTranslationsJson as Record<string, LegendTranslation>
const weaponTranslations = weaponTranslationsJson as Record<string, DescriptionTranslation>
const mapTranslations = mapTranslationsJson as Record<string, DescriptionTranslation>
const newsTranslations = newsTranslationsJson as Record<string, NewsTranslation>
const media = mediaJson as MediaManifest

const rawLegends = legendsJson as Dataset<Legend>
const rawWeapons = weaponsJson as Dataset<Weapon>
const rawMaps = mapsJson as Dataset<MapRecord>
const rawNews = newsJson as Dataset<NewsItem>

export const season = seasonJson as SeasonRecord
export const attachments = attachmentsJson as Dataset<CorruptedAttachment> & {
  translationPolicy: { familyNameZh: string; familyNameEn: string; statusZh: string; aliasesZh: string[] }
}

export const legends: Dataset<Legend> = {
  ...rawLegends,
  items: rawLegends.items.map((legend) => ({
    ...legend,
    descriptionZh: legendTranslations[legend.id]?.descriptionZh,
    media: media.legends[legend.id],
    abilities: legend.abilities.map((ability) => ({
      ...ability,
      descriptionZh: legendTranslations[legend.id]?.abilities[ability.id],
      media: media.abilities[ability.id],
    })),
  })),
}

export const weapons: Dataset<Weapon> = {
  ...rawWeapons,
  items: rawWeapons.items.map((weapon) => ({
    ...weapon,
    nameZh: weaponTranslations[weapon.id]?.nameZh ?? weapon.nameZh,
    aliasesZh: weaponTranslations[weapon.id]?.aliasesZh ?? weapon.aliasesZh,
    descriptionZh: weaponTranslations[weapon.id]?.descriptionZh,
    media: media.weapons[weapon.id],
  })),
}

export const maps: Dataset<MapRecord> = {
  ...rawMaps,
  items: rawMaps.items.map((map) => ({
    ...map,
    nameZh: mapTranslations[map.id]?.nameZh ?? map.nameZh,
    aliasesZh: mapTranslations[map.id]?.aliasesZh ?? map.aliasesZh,
    descriptionZh: map.descriptionZh ?? mapTranslations[map.id]?.descriptionZh,
    media: media.maps[map.id],
  })),
}

export const attachmentMedia = media.attachments

export const news: Dataset<NewsItem> = {
  ...rawNews,
  items: rawNews.items.map((item) => ({ ...item, ...newsTranslations[item.id] })),
}

const sourceDates = [legends.meta.fetchedAt, weapons.meta.fetchedAt, maps.meta.fetchedAt, news.meta.fetchedAt, attachments.meta.fetchedAt, season.meta.fetchedAt]
  .filter(Boolean)
  .sort()

export const dataSnapshot = {
  season: `Season ${season.season} · ${season.name}`,
  patch: season.patch,
  verifiedAt: sourceDates[sourceDates.length - 1] ?? '',
  oldestSourceAt: sourceDates[0] ?? '',
  counts: {
    legends: legends.items.length,
    abilities: legends.items.reduce((total, legend) => total + legend.abilities.length, 0),
    upgrades: legends.items.reduce((total, legend) => total + (legend.upgrades?.reduce((n, tier) => n + tier.options.length, 0) ?? 0), 0),
    weapons: weapons.items.length,
    attachments: attachments.items.length,
    maps: maps.items.length,
    news: news.items.length,
  },
}
