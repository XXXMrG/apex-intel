const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const dataDir = path.join(__dirname, '..', 'src', 'data')
const legends = require(path.join(dataDir, 'legends.json'))
const attachments = require(path.join(dataDir, 'attachments.json'))
const weapons = require(path.join(dataDir, 'weapons.json'))
const maps = require(path.join(dataDir, 'maps.json'))
const news = require(path.join(dataDir, 'news.json'))
const legendTranslations = require(path.join(dataDir, 'translations-legends.zh-CN.json'))
const weaponTranslations = require(path.join(dataDir, 'translations-weapons.zh-CN.json'))
const mapTranslations = require(path.join(dataDir, 'translations-maps.zh-CN.json'))
const newsTranslations = require(path.join(dataDir, 'translations-news.zh-CN.json'))
const media = require(path.join(dataDir, 'media-manifest.json'))
const season = require(path.join(dataDir, 'season.json'))
const upgradeSnapshot = require(path.join(__dirname, '..', 'research', 'season30-upgrades.json'))

function numericTokens(text) {
  return String(text).match(/[+-]?\d+(?:\.\d+)?%?/g) ?? []
}

function assertUpgradeDescriptionZh(name, items) {
  const options = items.flatMap((legend) => legend.upgrades.flatMap((tier) => tier.options.map((option) => ({ legend, tier, option }))))
  assert.equal(options.length, 112, `${name}: Season 30 upgrade count must be 112`)
  for (const { legend, tier, option } of options) {
    assert.ok(option.descriptionZh?.trim(), `${name}/${legend.id}/level${tier.armorLevel}/${option.id}: missing Chinese upgrade description`)
    const sourceNumbers = numericTokens(option.description).map((token) => token.replace(/^[+-]/, ''))
    const translatedNumbers = numericTokens(option.descriptionZh).map((token) => token.replace(/^[+-]/, ''))
    for (const token of new Set(sourceNumbers)) {
      assert.ok(
        translatedNumbers.filter((value) => value === token).length >= sourceNumbers.filter((value) => value === token).length,
        `${name}/${legend.id}/level${tier.armorLevel}/${option.id}: Chinese upgrade description changed numeric token ${token}`,
      )
    }
  }
}

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
validateDataset('attachments', attachments)
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
assert.ok(Object.values(weaponTranslations).every((item) => item.nameZh?.trim() && Array.isArray(item.aliasesZh)), 'weapon Chinese names/aliases incomplete')
assert.ok(Object.values(mapTranslations).every((item) => item.nameZh?.trim() && Array.isArray(item.aliasesZh)), 'map Chinese names/aliases incomplete')
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
  assert.equal(legend.upgrades?.length, 2, `${legend.name}: must have blue and purple upgrade tiers`)
  assert.deepEqual(legend.upgrades.map((tier) => tier.armorLevel), [2, 3], `${legend.name}: invalid armor upgrade levels`)
  for (const tier of legend.upgrades) {
    assert.equal(tier.options.length, 2, `${legend.name}/level${tier.armorLevel}: must have two choices`)
    assert.deepEqual(tier.options.map((option) => option.branch), ['A', 'B'])
    assert.ok(tier.options.every((option) => option.name && option.nameZh && option.description && option.descriptionZh), `${legend.name}/level${tier.armorLevel}: incomplete upgrade`)
  }
  assert.ok(legend.upgradeSource?.url?.startsWith('https://'), `${legend.name}: missing upgrade source`)
}
assert.deepEqual(legends.items.filter((legend) => !legend.nameZh).map((legend) => legend.name), [])
assert.equal(legends.items.reduce((sum, legend) => sum + legend.upgrades.flatMap((tier) => tier.options).length, 0), 112)
assert.equal(upgradeSnapshot.meta.count, 112)
assertUpgradeDescriptionZh('legends', legends.items)
assertUpgradeDescriptionZh('season30-upgrades', upgradeSnapshot.items.map((item) => ({ id: item.legendId, upgrades: item.tiers })))

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
  assert.ok(weapon.nameZh && weapon.ammoZh && Array.isArray(weapon.attachmentsZh), `${weapon.name}: Chinese naming layer incomplete`)
}
assert.deepEqual(weapons.items.filter((weapon) => weapon.rpm == null).map((weapon) => weapon.name).sort(), [...expectedNullRpm].sort())
assert.ok(!/(?:px\||link=|\?\?\?|\[\[|\{\{)/.test(JSON.stringify(weapons)), 'weapon data contains unparsed wiki markup')
assert.deepEqual(
  weapons.items.filter((weapon) => weapon.supplyDrop).map((weapon) => weapon.name).sort(),
  ['30-30 Repeater', 'Kraber .50-Cal Sniper', 'L-STAR EMG'],
)
assert.equal(weapons.items.find((weapon) => weapon.id === 'g7-scout').bodyDamage, 33)
assert.deepEqual(weapons.items.find((weapon) => weapon.id === 'g7-scout').magazineSizes, [10, 12, 14, 16])
assert.equal(weapons.items.find((weapon) => weapon.id === '30-30-repeater').bodyDamage, 51)
assert.equal(weapons.items.find((weapon) => weapon.id === 'alternator-smg').bodyDamage, 18)
assert.deepEqual(weapons.items.find((weapon) => weapon.id === 'alternator-smg').magazineSizes, [18, 20, 22, 26])
assert.equal(weapons.items.find((weapon) => weapon.id === 'r-99-smg').bodyDamage, 12)
assert.equal(weapons.items.find((weapon) => weapon.id === 're-45-burst').bodyDamage, 16)
assert.deepEqual(weapons.items.find((weapon) => weapon.id === 're-45-burst').magazineSizes, [15, 18, 21, 24])
for (const weaponId of ['hemlok-breach-ar', 'alternator-smg', 'r-99-smg', 're-45-burst', 'g7-scout', '30-30-repeater']) {
  const override = weapons.items.find((weapon) => weapon.id === weaponId).seasonOverride
  assert.equal(override.patch, '30.0')
  assert.match(override.url, /^https:\/\/www\.ea\.com\//)
  assert.ok(override.fields.length > 0)
}
assert.equal(weapons.items.find((weapon) => weapon.id === 'r-99-smg').corruptedMagazineSize, 33)

assert.equal(attachments.items.length, 5, 'Season 30 must contain five corrupted attachments')
assert.deepEqual(attachments.items.map((item) => item.id).sort(), [
  'agile-standard-stock', 'headseeker-barrel', 'overflowing-magazine', 'rapid-sniper-stock', 'tactical-laser',
])
const weaponIds = new Set(weapons.items.map((weapon) => weapon.id))
for (const attachment of attachments.items) {
  assert.equal(attachment.limitPerWeapon, 1)
  assert.ok(attachment.nameZh && attachment.buffZh && attachment.drawbackZh && attachment.compatibilityBasisZh)
  assert.ok(attachment.compatibleWeaponIds.length && attachment.compatibleWeaponIds.every((id) => weaponIds.has(id)))
  assert.ok(attachment.verifiedExamples.length && attachment.verifiedExamples.every((example) => example.stats.length && example.evidence))
}

assert.equal(season.season, 30)
assert.equal(season.patch, '30.0')
assert.equal(season.status, 'live')
assert.equal(season.liveAt, '2026-08-04')
assert.equal(season.meta.count, season.highlights.length)
assert.equal(season.officialSources.length, 3)
assert.ok(season.officialSources.every((source) => source.url.startsWith('https://www.ea.com/')))
const seasonCopy = JSON.stringify(season)
assert.match(seasonCopy, /每 18 秒恢复一个完整弹匣量/)
assert.doesNotMatch(seasonCopy, /射击后等待 6 秒|能量弹药每组 20/)

const bloodhound = legends.items.find((legend) => legend.id === 'bloodhound')
assert.match(bloodhound.abilities.find((ability) => ability.type === 'passive').description, /400 meters/)
const truePredator = bloodhound.upgrades.flatMap((tier) => tier.options).find((option) => option.id === 'true-predator')
assert.match(truePredator.description, /did not publish the re-cloak delay/)
assert.doesNotMatch(truePredator.description, /1\.5 seconds/)
for (const mapId of ['world-s-edge', 'storm-point', 'e-district']) {
  assert.match(maps.items.find((map) => map.id === mapId).status, /Season 30/)
}
assert.ok([legends, weapons, maps, attachments].every((dataset) => dataset.meta.gameVersion.includes('Season 30')))

const expectedMediaKeys = {
  legends: legends.items.map((item) => item.id),
  abilities: legends.items.flatMap((item) => item.abilities.map((ability) => ability.id)),
  weapons: weapons.items.map((item) => item.id),
  maps: maps.items.map((item) => item.id),
  attachments: [...new Set(weapons.items.flatMap((item) => item.attachments))],
}
assert.equal(media.meta.runtimeHotlinks, false, 'media must be locally hosted at runtime')
const mediaHashes = new Map()
let mediaBytes = 0
for (const [group, expectedKeys] of Object.entries(expectedMediaKeys)) {
  assert.deepEqual(Object.keys(media[group]).sort(), expectedKeys.sort(), `${group}: media key mismatch`)
  assert.equal(media.meta.counts[group], expectedKeys.length, `${group}: media count mismatch`)
  for (const [key, asset] of Object.entries(media[group])) {
    assert.ok(asset.src.startsWith('/media/apex/'), `${group}/${key}: media must use a local static path`)
    assert.ok(asset.sourceUrl.startsWith('https://apexlegends.wiki.gg/wiki/File:'), `${group}/${key}: invalid file source URL`)
    assert.ok(asset.sourceSha1 && asset.rights, `${group}/${key}: missing source provenance`)
    const localPath = path.join(__dirname, '..', 'public', asset.src)
    assert.ok(fs.existsSync(localPath), `${group}/${key}: local media missing: ${asset.src}`)
    const bytes = fs.readFileSync(localPath)
    assert.ok(bytes.length > 100, `${group}/${key}: local media is empty`)
    mediaBytes += bytes.length
    const digest = crypto.createHash('sha256').update(bytes).digest('hex')
    assert.equal(digest, asset.localSha256, `${group}/${key}: local media checksum mismatch`)
    mediaHashes.set(digest, [...(mediaHashes.get(digest) || []), `${group}/${key}`])
  }
}
const duplicateMediaGroups = [...mediaHashes.values()].filter((refs) => refs.length > 1)
assert.deepEqual(duplicateMediaGroups, [], `unexpected duplicate media: ${JSON.stringify(duplicateMediaGroups)}`)

assert.equal(maps.items.length, 34, 'map catalogue must contain 34 deduplicated locations')
assert.equal(maps.items.filter((map) => map.mode.includes('Battle Royale')).length, 6)
for (const map of maps.items) {
  assert.ok(map.name && map.mode && map.status && map.releaseDate && map.description)
  assert.ok(map.source.revision, `${map.name}: missing page revision`)
  assert.ok(map.nameZh && map.modeZh && Array.isArray(map.aliasesZh), `${map.name}: Chinese naming layer incomplete`)
}

for (const filename of ['legends.json', 'weapons.json', 'maps.json']) {
  assert.deepEqual(
    require(path.join(__dirname, '..', 'research', filename)),
    require(path.join(dataDir, filename)),
    `${filename}: research and runtime snapshots diverged`,
  )
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
  upgrades: legends.items.reduce((sum, legend) => sum + legend.upgrades.flatMap((tier) => tier.options).length, 0),
  weapons: weapons.items.length,
  corruptedAttachments: attachments.items.length,
  weaponCategoryCounts,
  maps: maps.items.length,
  news: news.items.length,
  newsTotalAvailable: news.meta.totalAvailable,
  uniqueIds: true,
  requiredFields: true,
  sourceRevisions: true,
  media: {
    ...media.meta.counts,
    total: Object.values(media.meta.counts).reduce((sum, count) => sum + count, 0),
    bytes: mediaBytes,
    localOnly: true,
    duplicateGroups: duplicateMediaGroups.length,
  },
  nullableRpm: expectedNullRpm,
  translations: { legends: 28, abilities: 84, weapons: 29, maps: 34, news: news.items.length },
}, null, 2))
