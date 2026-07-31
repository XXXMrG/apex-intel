const assert = require('node:assert/strict')
const path = require('node:path')

const dataDir = path.join(__dirname, '..', 'src', 'data')
const legends = require(path.join(dataDir, 'legends.json'))
const weapons = require(path.join(dataDir, 'weapons.json'))
const maps = require(path.join(dataDir, 'maps.json'))
const news = require(path.join(dataDir, 'news.json'))
const legendTranslations = require(path.join(dataDir, 'translations-legends.zh-CN.json'))
const weaponTranslations = require(path.join(dataDir, 'translations-weapons.zh-CN.json'))
const mapTranslations = require(path.join(dataDir, 'translations-maps.zh-CN.json'))
const newsTranslations = require(path.join(dataDir, 'translations-news.zh-CN.json'))

function validateDataset(name, dataset) {
  assert.equal(dataset.meta.count, dataset.items.length, `${name}: meta count mismatch`)
  const ids = dataset.items.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length, `${name}: duplicate id`)
  for (const item of dataset.items) {
    assert.ok(item.id, `${name}: missing id`)
    assert.ok(item.source?.url?.startsWith('https://'), `${name}/${item.id}: invalid source URL`)
    assert.ok(item.source?.fetchedAt, `${name}/${item.id}: missing fetchedAt`)
    assert.ok(item.source?.license, `${name}/${item.id}: missing license`)
  }
}

validateDataset('legends', legends)
validateDataset('weapons', weapons)
validateDataset('maps', maps)
validateDataset('news', news)

function assertTranslationKeys(name, items, translations) {
  assert.deepEqual(Object.keys(translations).sort(), items.map((item) => item.id).sort(), `${name}: translation key mismatch`)
}

assertTranslationKeys('legends', legends.items, legendTranslations)
assertTranslationKeys('weapons', weapons.items, weaponTranslations)
assertTranslationKeys('maps', maps.items, mapTranslations)
assertTranslationKeys('news', news.items, newsTranslations)
for (const legend of legends.items) {
  const translation = legendTranslations[legend.id]
  assert.ok(translation.descriptionZh?.trim(), `${legend.id}: missing Chinese description`)
  assert.deepEqual(Object.keys(translation.abilities).sort(), legend.abilities.map((ability) => ability.id).sort(), `${legend.id}: ability translation mismatch`)
  assert.ok(Object.values(translation.abilities).every((description) => description.trim()), `${legend.id}: empty Chinese ability description`)
}
assert.ok(Object.values(weaponTranslations).every((item) => item.descriptionZh?.trim()), 'weapon Chinese descriptions incomplete')
assert.ok(Object.values(mapTranslations).every((item) => item.descriptionZh?.trim()), 'map Chinese descriptions incomplete')
assert.ok(Object.values(newsTranslations).every((item) => item.titleZh?.trim() && item.summaryZh?.trim()), 'news Chinese translations incomplete')

assert.equal(legends.items.length, 28, 'legend inventory must contain 28 records')
assert.equal(legends.items.reduce((sum, legend) => sum + legend.abilities.length, 0), 84, 'core ability count must be 84')
for (const legend of legends.items) {
  assert.ok(legend.name && legend.class && legend.releaseDate && legend.description && legend.title)
  assert.ok(legend.source.revision, `${legend.name}: missing page revision`)
  assert.deepEqual(new Set(legend.abilities.map((ability) => ability.type)), new Set(['passive', 'tactical', 'ultimate']))
  for (const ability of legend.abilities) {
    assert.ok(ability.name && ability.description, `${legend.name}/${ability.type}: incomplete ability`)
    if (ability.type === 'passive') assert.equal(ability.cooldown, null)
  }
}
assert.deepEqual(legends.items.filter((legend) => !legend.nameZh).map((legend) => legend.name), ['Axle'])

assert.equal(weapons.items.length, 29, 'current weapon inventory must contain 29 records')
const weaponCategoryCounts = Object.fromEntries(
  [...weapons.items.reduce((counts, weapon) => counts.set(weapon.category, (counts.get(weapon.category) || 0) + 1), new Map())].sort(),
)
assert.deepEqual(weaponCategoryCounts, { AR: 5, LMG: 4, Marksman: 4, Pistol: 3, SMG: 5, Shotgun: 4, Sniper: 4 })
const expectedNullRpm = ['Bocek Compound Bow', 'EVA-8 Auto', 'Peacekeeper', 'RE-45 Burst']
for (const weapon of weapons.items) {
  assert.ok(weapon.name && weapon.ammo && weapon.description)
  assert.ok(weapon.fireModes.length, `${weapon.name}: missing fire mode`)
  assert.ok(weapon.magazineSizes.length, `${weapon.name}: missing magazine data`)
  assert.notEqual(weapon.bodyDamage, null, `${weapon.name}: missing body damage`)
  assert.notEqual(weapon.headDamage, null, `${weapon.name}: missing head damage`)
  assert.notEqual(weapon.legDamage, null, `${weapon.name}: missing leg damage`)
  if (weapon.rpm == null) assert.ok(expectedNullRpm.includes(weapon.name), `${weapon.name}: unexpected missing RPM`)
  assert.ok(weapon.source.revision, `${weapon.name}: missing page revision`)
}
assert.deepEqual(weapons.items.filter((weapon) => weapon.rpm == null).map((weapon) => weapon.name).sort(), [...expectedNullRpm].sort())
assert.ok(!/(?:px\||link=|\?\?\?|\[\[|\{\{)/.test(JSON.stringify(weapons)), 'weapon data contains unparsed wiki markup')
assert.deepEqual(
  weapons.items.filter((weapon) => weapon.supplyDrop).map((weapon) => weapon.name).sort(),
  ['G7 Scout', 'Kraber .50-Cal Sniper', 'L-STAR EMG'],
)

assert.equal(maps.items.length, 34, 'map catalogue must contain 34 deduplicated locations')
assert.equal(maps.items.filter((map) => map.mode.includes('Battle Royale')).length, 6)
for (const map of maps.items) {
  assert.ok(map.name && map.mode && map.status && map.releaseDate && map.description)
  assert.ok(map.source.revision, `${map.name}: missing page revision`)
}

assert.ok(news.items.length >= 20, 'news snapshot must contain at least 20 entries')
assert.ok(news.items.length >= news.meta.totalAvailable && news.items.length <= news.meta.totalAvailable + 1, 'full EA pagination plus featured item is incomplete')
for (const item of news.items) {
  assert.ok(item.title && item.summary && item.date && item.category && item.image)
  assert.ok(item.url.startsWith('https://www.ea.com/games/apex-legends/'))
}
const dates = news.items.map((item) => item.date)
assert.deepEqual(dates, [...dates].sort().reverse(), 'news must be sorted newest first')

console.log(JSON.stringify({
  legends: legends.items.length,
  abilities: legends.items.reduce((sum, legend) => sum + legend.abilities.length, 0),
  weapons: weapons.items.length,
  weaponCategoryCounts,
  maps: maps.items.length,
  news: news.items.length,
  newsTotalAvailable: news.meta.totalAvailable,
  uniqueIds: true,
  requiredFields: true,
  sourceRevisions: true,
  nullableRpm: expectedNullRpm,
  translations: { legends: 28, abilities: 84, weapons: 29, maps: 34, news: news.items.length },
}, null, 2))
