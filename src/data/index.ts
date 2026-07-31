import legendsJson from './legends.json'
import mapsJson from './maps.json'
import newsJson from './news.json'
import weaponsJson from './weapons.json'
import legendTranslationsJson from './translations-legends.zh-CN.json'
import mapTranslationsJson from './translations-maps.zh-CN.json'
import newsTranslationsJson from './translations-news.zh-CN.json'
import weaponTranslationsJson from './translations-weapons.zh-CN.json'
import type { Dataset, Legend, MapRecord, NewsItem, Weapon } from '../types'

type LegendTranslation = { descriptionZh: string; abilities: Record<string, string> }
type DescriptionTranslation = { descriptionZh: string }
type NewsTranslation = { titleZh: string; summaryZh: string }

const legendTranslations = legendTranslationsJson as Record<string, LegendTranslation>
const weaponTranslations = weaponTranslationsJson as Record<string, DescriptionTranslation>
const mapTranslations = mapTranslationsJson as Record<string, DescriptionTranslation>
const newsTranslations = newsTranslationsJson as Record<string, NewsTranslation>

const rawLegends = legendsJson as Dataset<Legend>
const rawWeapons = weaponsJson as Dataset<Weapon>
const rawMaps = mapsJson as Dataset<MapRecord>
const rawNews = newsJson as Dataset<NewsItem>

export const legends: Dataset<Legend> = {
  ...rawLegends,
  items: rawLegends.items.map((legend) => ({
    ...legend,
    descriptionZh: legendTranslations[legend.id]?.descriptionZh,
    abilities: legend.abilities.map((ability) => ({
      ...ability,
      descriptionZh: legendTranslations[legend.id]?.abilities[ability.id],
    })),
  })),
}

export const weapons: Dataset<Weapon> = {
  ...rawWeapons,
  items: rawWeapons.items.map((weapon) => ({
    ...weapon,
    descriptionZh: weaponTranslations[weapon.id]?.descriptionZh,
  })),
}

export const maps: Dataset<MapRecord> = {
  ...rawMaps,
  items: rawMaps.items.map((map) => ({
    ...map,
    descriptionZh: mapTranslations[map.id]?.descriptionZh,
  })),
}

export const news: Dataset<NewsItem> = {
  ...rawNews,
  items: rawNews.items.map((item) => ({ ...item, ...newsTranslations[item.id] })),
}

export const dataSnapshot = {
  season: legends.meta.gameVersion,
  verifiedAt: [legends.meta.fetchedAt, weapons.meta.fetchedAt, maps.meta.fetchedAt, news.meta.fetchedAt]
    .filter(Boolean)
    .sort()
    .at(0) ?? '',
  counts: {
    legends: legends.items.length,
    abilities: legends.items.reduce((total, legend) => total + legend.abilities.length, 0),
    weapons: weapons.items.length,
    maps: maps.items.length,
    news: news.items.length,
  },
}
