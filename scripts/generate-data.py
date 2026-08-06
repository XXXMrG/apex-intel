#!/usr/bin/env python3
"""Generate audited Apex static datasets from EA and Apex Legends Wiki sources.

Requires: pip install -r requirements-data.txt
The default mode fetches fresh MediaWiki snapshots. Set APEX_DATA_OFFLINE=1 to
explicitly reuse the documented /tmp research caches. Generated data is written
to src/data/ and research/.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import mwparserfromhell

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
RESEARCH_DIR = ROOT / "research"
WIKI_API = "https://apexlegends.wiki.gg/api.php"
WIKI_LICENSE = "CC BY-NC-SA 4.0"
EA_NEWS_API = "https://drop-api.ea.com:443/news-articles/list"
USER_AGENT = "ApexIntelDataAudit/0.1 (+https://github.com/XXXMrG/apex-intel)"
NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
OFFLINE_CACHE = os.environ.get("APEX_DATA_OFFLINE") == "1"

LEGEND_TITLES = [
    "Bloodhound", "Gibraltar", "Lifeline", "Pathfinder", "Wraith", "Bangalore",
    "Caustic", "Mirage", "Octane", "Wattson", "Crypto", "Revenant", "Loba",
    "Rampart", "Horizon", "Fuse", "Valkyrie", "Seer", "Ash", "Mad Maggie",
    "Newcastle", "Vantage", "Catalyst", "Ballistic", "Conduit", "Alter",
    "Sparrow", "Axle",
]

LEGEND_ZH = {
    "Bloodhound": "寻血猎犬", "Gibraltar": "直布罗陀", "Lifeline": "命脉",
    "Pathfinder": "探路者", "Wraith": "恶灵", "Bangalore": "班加罗尔",
    "Caustic": "腐蚀", "Mirage": "幻象", "Octane": "辛烷", "Wattson": "沃特森",
    "Crypto": "密客", "Revenant": "亡灵", "Loba": "罗芭", "Rampart": "兰伯特",
    "Horizon": "地平线", "Fuse": "暴雷", "Valkyrie": "瓦尔基里", "Seer": "希尔",
    "Ash": "艾许", "Mad Maggie": "疯玛吉", "Newcastle": "纽卡斯尔",
    "Vantage": "万蒂奇", "Catalyst": "催化姬", "Ballistic": "弹道",
    "Conduit": "导管", "Alter": "变幻", "Sparrow": "麻雀",
}

WEAPON_TITLES = [
    "HAVOC Rifle", "VK-47 Flatline", "Hemlok Breach AR", "R-301 Carbine",
    "Nemesis Burst AR", "Alternator SMG", "Prowler Burst PDW", "R-99 SMG",
    "Volt SMG", "C.A.R. SMG", "Devotion LMG", "L-STAR EMG", "M600 Spitfire",
    "Rampage LMG", "G7 Scout", "Triple Take", "30-30 Repeater",
    "Bocek Compound Bow", "Charge Rifle", "Longbow DMR", "Kraber .50-Cal Sniper",
    "Sentinel", "EVA-8 Auto", "Mastiff Shotgun", "Mozambique Shotgun",
    "Peacekeeper", "RE-45 Burst", "P2020", "Wingman",
]

WEAPON_CATEGORY = {
    "Assault Rifle": "AR", "Assault rifle": "AR", "Submachine Gun": "SMG",
    "Light Machine Gun": "LMG", "Marksman Weapon": "Marksman",
    "Sniper Rifle": "Sniper", "Shotgun": "Shotgun", "Pistol": "Pistol",
}

CARE_PACKAGE = {"Kraber .50-Cal Sniper", "30-30 Repeater", "L-STAR EMG"}

BR_MAPS = ["Broken Moon", "E-District", "Kings Canyon", "Olympus", "Storm Point", "World's Edge"]
CONTROL_MAPS = ["Barometer", "Caustic Treatment", "Hammond Labs", "Lava Siphon", "Production Yard", "Thunderdome"]
GUN_RUN_MAPS = ["Autumn Estates", "Fragment East", "Monument", "Skull Town", "Perpetual Core", "Thunderdome", "Wattson's Pylon", "ZEUS Station"]
TDM_MAPS = ["Fragment East", "Habitat 4", "Monument", "Overflow", "Party Crasher", "Phase Runner", "Skull Town", "Perpetual Core", "Thunderdome", "Wattson's Pylon", "ZEUS Station"]
LOCKDOWN_MAPS = ["Monument", "Skull Town", "Perpetual Core", "Thunderdome", "ZEUS Station"]
ARENAS_MAPS = ["Encore", "Drop-Off", "Habitat 4", "Overflow", "Phase Runner", "Party Crasher", "Autumn Estates", "The Dome", "High Desert", "Velvet Oasis", "Skull Town", "Artillery Battery", "Golden Gardens", "Thermal Station"]
OTHER_MAPS = ["Firing Range", "The Wall", "Winter Express"]
MAP_TITLES = list(dict.fromkeys(BR_MAPS + CONTROL_MAPS + GUN_RUN_MAPS + TDM_MAPS + LOCKDOWN_MAPS + ARENAS_MAPS + OTHER_MAPS))

MAP_SOURCE_TITLES = {"Thunderdome": "Thunderdome (map)", "Phase Runner": "Phase Runner (map)"}
MAP_RELEASE_DATES = {
    "Kings Canyon": "2019-02-04", "World's Edge": "2019-10-01", "Olympus": "2020-11-04",
    "Storm Point": "2021-11-02", "Broken Moon": "2022-11-01", "E-District": "2024-08-06",
    "Barometer": "2021-11-02", "Caustic Treatment": "2021-03-09", "Hammond Labs": "2020-11-04",
    "Lava Siphon": "2021-08-03", "Production Yard": "2022-11-01", "Thunderdome": "2024-02-13",
    "Autumn Estates": "2020-11-04", "Fragment East": "2020-02-04", "Monument": "2023-05-09",
    "Skull Town": "2019-02-04", "Perpetual Core": "2022-11-01", "Wattson's Pylon": "2023-10-31",
    "ZEUS Station": "2023-10-31", "Habitat 4": "2022-01-11", "Overflow": "2021-07-13",
    "Party Crasher": "2021-05-04", "Phase Runner": "2021-05-04", "The Wall": "2021-11-02",
    "Firing Range": "2019-02-04", "Drop-Off": "2022-03-29", "Encore": "2021-10-12",
    "The Dome": "2021-08-03", "High Desert": "2021-08-03", "Velvet Oasis": "2021-08-03",
    "Artillery Battery": "2021-05-04", "Golden Gardens": "2021-05-04", "Thermal Station": "2021-05-04",
    "Winter Express": "2019-12-12",
}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def request_json(url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.load(response)


def fetch_wiki_pages(titles: list[str]) -> tuple[list[dict[str, Any]], str]:
    data = request_json(WIKI_API, {
        "action": "query", "format": "json", "formatversion": 2,
        "prop": "info|revisions", "inprop": "url", "redirects": 1,
        "rvprop": "ids|timestamp|content", "rvslots": "main",
        "titles": "|".join(titles), "curtimestamp": 1,
    })
    pages = data["query"]["pages"]
    return pages, data.get("curtimestamp", NOW)


def strip_markup(value: Any, page_name: str = "") -> str:
    if value is None:
        return ""
    text = str(value).replace("{{PAGENAME}}", page_name)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"\[\[(?:File|Image):.*?\]\]", " ", text, flags=re.I | re.S)
    text = re.sub(r"<br\s*/?>", " / ", text, flags=re.I)
    text = re.sub(r"<ref\b[^>]*>.*?</ref>|<ref\b[^>]*/>", "", text, flags=re.I | re.S)
    code = mwparserfromhell.parse(text)
    for template in reversed(code.filter_templates(recursive=True)):
        name = str(template.name).strip().lower().replace("_", " ")
        replacement = ""
        if name in {"itemlink", "abilitylink", "texttip", "legendary", "mythic", "rare", "epic", "common"}:
            if template.has("text"):
                replacement = f" {template.get('text').value} "
            elif template.params:
                replacement = f" {template.params[0].value} "
        elif name == "*":
            replacement = " · "
        elif name.startswith("level0123"):
            replacement = " / ".join(str(param.value).strip() for param in template.params[:4])
        elif name in {"nowrap", "small", "tooltip"} and template.params:
            replacement = str(template.params[-1].value)
        try:
            code.replace(template, replacement)
        except ValueError:
            pass
    text = code.strip_code(normalize=True, collapse=True)
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    text = re.sub(r"\s*/\s*", " / ", text)
    return re.sub(r"\s+", " ", text).strip(" \n\t|-")


def template_params(template: Any) -> dict[str, str]:
    return {str(param.name).strip(): str(param.value).strip() for param in template.params}


def first_template(code: Any, prefix: str) -> Any:
    prefix = prefix.lower().replace("-", " ")
    for template in code.filter_templates(recursive=False):
        name = str(template.name).strip().lower().replace("-", " ")
        if name.startswith(prefix):
            return template
    raise ValueError(f"Template not found: {prefix}")


def extract_lead(wikitext: str, title: str) -> str:
    expanded = wikitext.replace("{{PAGENAME}}", title)
    patterns = [
        rf"'''{re.escape(title)}'''[^\n]*(?:\n(?!\s*\n)[^\n]*)*",
        rf"'''[^']*{re.escape(title.split()[0])}[^']*'''[^\n]*(?:\n(?!\s*\n)[^\n]*)*",
    ]
    for pattern in patterns:
        match = re.search(pattern, expanded, flags=re.I)
        if match:
            cleaned = strip_markup(match.group(0), title).replace("duraiton", "duration")
            if cleaned:
                if len(cleaned) > 500:
                    sentence_end = cleaned.rfind(". ", 0, 500)
                    cleaned = cleaned[:sentence_end + 1] if sentence_end >= 120 else cleaned[:497].rstrip() + "…"
                return cleaned
    return ""


def parse_iso_date(value: str) -> str | None:
    clean = strip_markup(value)
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%b %d %Y", "%B %d %Y"):
        try:
            return datetime.strptime(clean, fmt).date().isoformat()
        except ValueError:
            pass
    match = re.search(r"\d{4}-\d{2}-\d{2}", clean)
    return match.group(0) if match else None


def source_ref(name: str, url: str, revision: int | str | None, fetched_at: str, license_name: str) -> dict[str, Any]:
    return {"name": name, "url": url, "revision": revision, "fetchedAt": fetched_at, "license": license_name}


def load_legend_pages() -> tuple[list[dict[str, Any]], str]:
    cache = Path("/tmp/apex_legends_raw.json")
    if OFFLINE_CACHE:
        if not cache.exists():
            raise RuntimeError(f"Offline legend cache missing: {cache}")
        raw = json.loads(cache.read_text())
        return raw["pages"], raw.get("fetchedAt", NOW)
    return fetch_wiki_pages(LEGEND_TITLES)


def generate_legends() -> dict[str, Any]:
    pages, fetched_at = load_legend_pages()
    page_map = {page["title"]: page for page in pages}
    items = []
    missing_pages = sorted(set(LEGEND_TITLES) - set(page_map))
    if missing_pages:
        raise RuntimeError(f"Missing legend pages: {missing_pages}")

    for title in LEGEND_TITLES:
        page = page_map[title]
        revision = page["revisions"][0]
        wikitext = revision["slots"]["main"]["content"]
        code = mwparserfromhell.parse(wikitext)
        infobox = template_params(first_template(code, "infobox legend"))
        ability_templates = []
        for template in code.filter_templates(recursive=True):
            if str(template.name).strip().lower() == "ability":
                ability_templates.append(template_params(template))

        abilities_by_name = {strip_markup(a.get("name", ""), title).lower(): a for a in ability_templates}
        abilities_by_type = defaultdict(list)
        for ability in ability_templates:
            abilities_by_type[strip_markup(ability.get("type", ""), title).lower()].append(ability)

        abilities = []
        for ability_type, key in (("Passive", "passiveAbility"), ("Tactical", "tacticalAbility"), ("Ultimate", "ultimateAbility")):
            expected_name = strip_markup(infobox.get(key, ""), title)
            raw_ability = abilities_by_name.get(expected_name.lower())
            if raw_ability is None:
                candidates = abilities_by_type.get(ability_type.lower(), [])
                raw_ability = candidates[0] if len(candidates) == 1 else None
            if raw_ability is None:
                raise RuntimeError(f"Cannot resolve {title} {ability_type}: {expected_name}")
            raw_cooldown = strip_markup(raw_ability.get("cooldown", ""), title)
            cooldown = None
            if raw_cooldown:
                if re.fullmatch(r"\d+(?:\.\d+)?", raw_cooldown):
                    unit = "minutes" if ability_type == "Ultimate" else "seconds"
                    cooldown = f"{raw_cooldown} {unit}"
                else:
                    cooldown = raw_cooldown
            abilities.append({
                "id": f"{slugify(title)}-{ability_type.lower()}",
                "name": strip_markup(raw_ability.get("name", expected_name), title),
                "type": ability_type.lower(),
                "description": strip_markup(raw_ability.get("description", ""), title),
                "cooldown": cooldown,
            })

        page_url = page.get("fullurl") or f"https://apexlegends.wiki.gg/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
        items.append({
            "id": slugify(title), "name": title, "nameZh": LEGEND_ZH.get(title),
            "title": strip_markup(infobox.get("title", ""), title),
            "class": strip_markup(infobox.get("class", ""), title),
            "releaseDate": parse_iso_date(infobox.get("addDate", "")),
            "description": extract_lead(wikitext, title) or f"{title} is a {strip_markup(infobox.get('class', ''), title)} Legend.",
            "abilities": abilities,
            "source": source_ref("The Apex Legends Wiki", page_url, revision.get("revid"), fetched_at, WIKI_LICENSE),
        })

    return {
        "meta": {
            "gameVersion": "Season 29 · Overclocked (post-midseason snapshot)", "fetchedAt": fetched_at,
            "sourceName": "The Apex Legends Wiki", "sourceUrl": "https://apexlegends.wiki.gg/wiki/Legend",
            "license": WIKI_LICENSE, "count": len(items),
        },
        "items": items,
    }


def load_weapon_pages() -> tuple[dict[str, dict[str, Any]], str]:
    cache = Path("/tmp/apex-weapons-research/pages.json")
    if OFFLINE_CACHE:
        if not cache.exists():
            raise RuntimeError(f"Offline weapon cache missing: {cache}")
        raw = json.loads(cache.read_text())
        return raw["pages"], raw.get("curtimestamp", NOW)
    pages, fetched_at = fetch_wiki_pages(WEAPON_TITLES)
    normalized = {}
    for page in pages:
        revision = page["revisions"][0]
        normalized[page["title"]] = {
            "title": page["title"], "canonicalurl": page.get("fullurl"),
            "revision": {k: revision.get(k) for k in ("revid", "parentid", "timestamp")},
            "wikitext": revision["slots"]["main"]["content"],
        }
    return normalized, fetched_at


def normalize_hopup(value: str) -> str:
    names = {
        "turbocharger": "Turbocharger", "accelerator": "Accelerator", "elite": "Elite Hop-Up",
        "double_tap": "Double Tap Trigger", "selectfire": "Selectfire Receiver",
        "gun_shield": "Gun Shield Generator", "skullpiercer": "Skullpiercer Rifling",
        "disruptor": "Disruptor Rounds", "kinetic_feeder": "Kinetic Feeder",
        "graffiti_mod": "Graffiti Mod",
    }
    return names.get(value, value.replace("_", " ").title())


def parse_magazines(raw_value: str, page_name: str) -> list[int]:
    code = mwparserfromhell.parse(raw_value)
    for template in code.filter_templates(recursive=True):
        if str(template.name).strip().lower().replace("_", "").startswith("level0123"):
            values = []
            for param in template.params[:4]:
                match = re.search(r"\d+", strip_markup(param.value, page_name))
                if match:
                    values.append(int(match.group(0)))
            return values
    cleaned = strip_markup(raw_value, page_name)
    first_line = cleaned.split("/")[0]
    match = re.fullmatch(r"\s*(\d+)\s*", first_line)
    return [int(match.group(1))] if match else []


def parse_fire_modes(raw_value: str, page_name: str) -> list[str]:
    without_icons = re.sub(r"\[\[(?:File|Image):.*?\]\]", "", raw_value, flags=re.I | re.S)
    cleaned = strip_markup(without_icons, page_name)
    modes = [part.strip() for part in re.split(r"\s*/\s*|\s{2,}", cleaned) if part.strip()]
    return list(dict.fromkeys(modes))


def parse_number_or_text(raw_value: str, page_name: str) -> int | float | str | None:
    value = strip_markup(raw_value, page_name)
    if not value or re.fullmatch(r"[?\s/.-]+", value):
        return None
    if re.fullmatch(r"\d+", value):
        return int(value)
    if re.fullmatch(r"\d+\.\d+", value):
        return float(value)
    return value


def generate_weapons() -> dict[str, Any]:
    pages, fetched_at = load_weapon_pages()
    missing_pages = sorted(set(WEAPON_TITLES) - set(pages))
    if missing_pages:
        raise RuntimeError(f"Missing weapon pages: {missing_pages}")
    items = []
    for title in WEAPON_TITLES:
        page = pages[title]
        wikitext = page["wikitext"]
        code = mwparserfromhell.parse(wikitext)
        params = template_params(first_template(code, "infobox weapon"))
        raw_type = strip_markup(params.get("type", ""), title)
        attachments = []
        barrel = strip_markup(params.get("barrel", ""), title).lower()
        if barrel == "stabilizer": attachments.append("Barrel Stabilizer")
        elif barrel == "laser": attachments.append("Laser Sight")
        elif barrel: attachments.append("Special muzzle module")
        mag_type = strip_markup(params.get("magType", ""), title).lower()
        if mag_type == "bolt": attachments.append("Shotgun Bolt")
        elif mag_type == "car": attachments.append("Extended Light/Heavy Magazine")
        elif mag_type: attachments.append(f"Extended {mag_type.title()} Magazine")
        if strip_markup(params.get("optics", ""), title).lower() == "true": attachments.append("Optics")
        stock = strip_markup(params.get("stock", ""), title).lower()
        if stock == "standard": attachments.append("Standard Stock")
        elif stock == "sniper": attachments.append("Sniper Stock")
        hopup = strip_markup(params.get("hopup", ""), title).lower()
        if hopup: attachments.extend(normalize_hopup(part.strip()) for part in re.split(r"[,/|]", hopup) if part.strip())

        revision = page.get("revision", {})
        source_url = page.get("canonicalurl") or f"https://apexlegends.wiki.gg/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
        supply_drop = title in CARE_PACKAGE
        body_damage = parse_number_or_text(params.get("damageBody", ""), title)
        head_damage = parse_number_or_text(params.get("damageHead", ""), title)
        leg_damage = parse_number_or_text(params.get("damageLegs", ""), title)
        if title == "Sentinel":
            body_damage, head_damage, leg_damage = [
                re.sub(r"(?<=\d)\s+(?=\d)", " / ", str(value))
                for value in (body_damage, head_damage, leg_damage)
            ]
        loot_status = "补给箱" if supply_drop else "地面标准战利品"
        fire_modes = parse_fire_modes(params.get("fireModes", ""), title)
        if title == "Prowler Burst PDW":
            fire_modes = ["Burst (5)", "Auto"]
        items.append({
            "id": slugify(title), "name": strip_markup(params.get("name", title), title) or title,
            "category": WEAPON_CATEGORY.get(raw_type, raw_type),
            "ammo": ("Heavy / Light Rounds" if title == "C.A.R. SMG" else "Light Rounds" if title == "P2020" else strip_markup(params.get("ammoType", ""), title)) or None,
            "fireModes": fire_modes,
            "bodyDamage": body_damage, "headDamage": head_damage, "legDamage": leg_damage,
            "damage": {"body": body_damage, "head": head_damage, "legs": leg_damage},
            "rpm": parse_number_or_text(params.get("rateOfFire", ""), title),
            "magazineSizes": parse_magazines(params.get("magazineSize", ""), title),
            "currentLootTier": loot_status, "lootStatus": loot_status,
            "supplyDrop": supply_drop, "attachments": list(dict.fromkeys(attachments)),
            "description": strip_markup(params.get("description", ""), title),
            "source": source_ref("The Apex Legends Wiki", source_url, revision.get("revid"), fetched_at, WIKI_LICENSE),
        })

    return {
        "meta": {
            "gameVersion": "Season 30 · Marked (pre-editorial wiki snapshot)", "fetchedAt": fetched_at,
            "sourceName": "Wiki stat snapshots; EA 30.0 overrides applied by apply-season-30.py",
            "sourceUrl": "https://apexlegends.wiki.gg/wiki/Weapon", "license": WIKI_LICENSE,
            "count": len(items),
        },
        "items": items,
    }


def load_map_pages() -> tuple[dict[str, dict[str, Any]], str]:
    raw_cache = Path("/tmp/apex-map-raw.json")
    if OFFLINE_CACHE and raw_cache.exists():
        raw = json.loads(raw_cache.read_text())
        pages = raw["pages"]
        fetched_at = raw.get("fetchedAt", NOW)
    elif not OFFLINE_CACHE:
        pages, fetched_at = fetch_wiki_pages([MAP_SOURCE_TITLES.get(title, title) for title in MAP_TITLES])
    else:
        pages, fetched_at = [], NOW
    by_source_title = {page["title"]: page for page in pages}
    loaded: dict[str, dict[str, Any]] = {}
    for display_title in MAP_TITLES:
        source_title = MAP_SOURCE_TITLES.get(display_title, display_title)
        page = by_source_title.get(source_title)
        if page is None:
            continue
        revision = page["revisions"][0]
        loaded[display_title] = {
            "title": page["title"], "wikitext": revision["slots"]["main"]["content"],
            "revision": {k: revision.get(k) for k in ("revid", "timestamp")},
        }
    if len(loaded) == len(MAP_TITLES):
        return loaded, fetched_at

    cache_dir = Path("/tmp/apex-wiki-pages")
    cached: dict[str, dict[str, Any]] = {}
    if OFFLINE_CACHE and cache_dir.exists():
        for title in MAP_TITLES:
            source_title = MAP_SOURCE_TITLES.get(title, title)
            filename = re.sub(r"[^A-Za-z0-9.-]+", "_", source_title).strip("_") + ".wiki"
            path = cache_dir / filename
            if path.exists():
                cached[title] = {"title": source_title, "wikitext": path.read_text(errors="ignore"), "revision": {}}
    missing = [title for title in MAP_TITLES if title not in cached]
    fetched_at = NOW
    if missing:
        if OFFLINE_CACHE:
            raise RuntimeError(f"Offline map caches missing: {missing}")
        pages, fetched_at = fetch_wiki_pages([MAP_SOURCE_TITLES.get(title, title) for title in missing])
        reverse = {MAP_SOURCE_TITLES.get(title, title): title for title in missing}
        for page in pages:
            display_title = reverse.get(page["title"], page["title"])
            revision = page["revisions"][0]
            cached[display_title] = {
                "title": page["title"], "wikitext": revision["slots"]["main"]["content"],
                "revision": {k: revision.get(k) for k in ("revid", "timestamp")},
            }
    return cached, fetched_at


def generate_maps() -> dict[str, Any]:
    pages, fetched_at = load_map_pages()
    items = []
    current_small = set(CONTROL_MAPS + GUN_RUN_MAPS + TDM_MAPS + LOCKDOWN_MAPS)
    for title in MAP_TITLES:
        page = pages[title]
        modes = []
        if title in BR_MAPS: modes.append("Battle Royale")
        if title in CONTROL_MAPS: modes.append("Control")
        if title in GUN_RUN_MAPS: modes.append("Gun Run")
        if title in TDM_MAPS: modes.append("Team Deathmatch")
        if title in LOCKDOWN_MAPS: modes.append("Lockdown")
        if title in ARENAS_MAPS: modes.append("Arenas (retired)")
        if title == "Firing Range": modes.append("Firing Range / Training")
        if title == "The Wall": modes.append("Gun Run (historical)")
        if title == "Winter Express": modes.append("Limited-time mode")

        if title in BR_MAPS: status = "当前 BR 地图 · 轮换随赛季变化"
        elif title in current_small: status = "当前模式地图 · 轮换随赛季变化"
        elif title == "Firing Range": status = "常驻训练地图"
        elif title == "Winter Express": status = "限时 / 赛季地图"
        elif title == "The Wall": status = "历史模式地图"
        else: status = "已退役竞技场 / 历史地图"

        source_title = page["title"]
        source_url = f"https://apexlegends.wiki.gg/wiki/{urllib.parse.quote(source_title.replace(' ', '_'))}"
        description = extract_lead(page["wikitext"], title)
        if not description:
            description = f"{title} is an Apex Legends map used for {', '.join(modes)}."
        items.append({
            "id": slugify(title), "name": title, "mode": " / ".join(modes), "status": status,
            "releaseDate": MAP_RELEASE_DATES.get(title), "description": description,
            "source": source_ref("The Apex Legends Wiki", source_url, page.get("revision", {}).get("revid"), fetched_at, WIKI_LICENSE),
        })
    return {
        "meta": {
            "gameVersion": "Season 29 map catalogue; current pools plus retired Arenas/history",
            "fetchedAt": fetched_at, "sourceName": "The Apex Legends Wiki map catalogue",
            "sourceUrl": "https://apexlegends.wiki.gg/wiki/Map", "license": WIKI_LICENSE,
            "count": len(items),
        },
        "items": items,
    }


def news_category(item: dict[str, Any]) -> str:
    title = item.get("title", "").lower()
    if "patch notes" in title or "designer" in title or "update" in title or "anti-cheat" in title:
        return "Game Updates"
    if "algs" in title or "esports" in title or "championship" in title:
        return "Esports"
    if "event" in title or "collection" in title or "milestone" in title:
        return "Events"
    return "Official News"


def generate_news() -> dict[str, Any]:
    page_size = 50
    offset = 0
    total_available: int | None = None
    featured: dict[str, Any] | None = None
    raw_items: list[dict[str, Any]] = []
    while total_available is None or offset < total_available:
        page = request_json(EA_NEWS_API, {
            "locale": "en", "limit": page_size, "offset": offset,
            "related-entity-slugs": "apex-legends", "linked-to-level": "Game",
            "include-featured": "true",
        })
        if featured is None and page.get("featured"):
            featured = page["featured"]
        total_available = int(page.get("totalItems", 0))
        batch = page.get("items", [])
        if not batch:
            break
        raw_items.extend(batch)
        offset += len(batch)
    if featured:
        raw_items.append(featured)
    deduped = {item["slug"]: item for item in raw_items if item.get("slug")}
    sorted_items = sorted(deduped.values(), key=lambda item: item.get("publishingDate", ""), reverse=True)
    items = []
    for item in sorted_items:
        image = item.get("image") or {}
        url = f"https://www.ea.com/games/apex-legends/apex-legends/news/{item['slug']}"
        items.append({
            "id": slugify(item["slug"]), "title": item.get("title", ""),
            "summary": item.get("summary", ""), "date": item.get("publishingDate", "")[:10],
            "category": news_category(item), "url": url,
            "image": image.get("ar16X9") or image.get("ar2X1") or image.get("ar1X1"),
            "source": source_ref("EA official Apex Legends News", url, None, NOW, "EA copyrighted content; metadata and outbound links only"),
        })
    return {
        "meta": {
            "gameVersion": "EA official news · complete paginated index snapshot",
            "fetchedAt": NOW, "sourceName": "EA official Apex Legends News / DROP API",
            "sourceUrl": "https://www.ea.com/games/apex-legends/apex-legends/news",
            "license": "EA copyrighted content; metadata and outbound links only", "count": len(items),
            "totalAvailable": total_available,
        },
        "items": items,
    }


def write_json(name: str, dataset: dict[str, Any]) -> None:
    content = json.dumps(dataset, ensure_ascii=False, indent=2) + "\n"
    (DATA_DIR / name).write_text(content)
    (RESEARCH_DIR / name).write_text(content)


def audit_dataset(name: str, dataset: dict[str, Any]) -> list[str]:
    items = dataset["items"]
    ids = [item["id"] for item in items]
    lines = [f"## {name}", "", f"- 记录数：**{len(items)}**", f"- 唯一 ID：**{len(set(ids))} / {len(ids)}**"]
    missing = []
    for index, item in enumerate(items):
        required = ["id", "name" if name != "新闻" else "title", "source"]
        for field in required:
            if not item.get(field): missing.append(f"{index}:{field}")
    lines.append(f"- 必填字段缺失：**{len(missing)}**" + (f"（{', '.join(missing[:10])}）" if missing else ""))
    return lines


def write_audits(legends: dict[str, Any], weapons: dict[str, Any], maps: dict[str, Any], news: dict[str, Any]) -> None:
    class_counts = Counter(item["class"] for item in legends["items"])
    ability_counts = Counter(ability["type"] for item in legends["items"] for ability in item["abilities"])
    legend_text = [
        "# 英雄与技能数据审计", "", f"核验时间：`{legends['meta']['fetchedAt']}`", "",
        f"- 英雄：**{len(legends['items'])}**", f"- 核心技能：**{sum(len(item['abilities']) for item in legends['items'])}**",
        f"- 技能类型：`{dict(ability_counts)}`", f"- 职业分布：`{dict(class_counts)}`",
        f"- 英雄唯一 ID：**{len({item['id'] for item in legends['items']})} / {len(legends['items'])}**",
        "- 每位英雄均校验被动、战术、终极三项；技能按英雄信息框中的能力名与正文 Ability 模板交叉匹配。",
        "- Axle 暂未写入中文译名，避免把未经官方中文页面核实的译名当成事实。",
        "", "## 来源与许可", "",
        "- 清单和结构化文本：The Apex Legends Wiki MediaWiki API。",
        "- 每条记录保存页面 URL、revision/oldid、抓取时间。",
        "- 许可：CC BY-NC-SA 4.0；本站数据页保留署名、非商业及相同方式共享要求。",
    ]
    (RESEARCH_DIR / "legends-audit.md").write_text("\n".join(legend_text) + "\n")

    category_counts = Counter(item["category"] for item in weapons["items"])
    nullable_rpm = [item["name"] for item in weapons["items"] if item["rpm"] is None]
    weapon_text = [
        "# 武器数据审计", "", f"核验时间：`{weapons['meta']['fetchedAt']}`", "",
        f"- 当前武器总数：**{len(weapons['items'])}**", f"- 分类计数：`{dict(category_counts)}`",
        f"- 补给箱：`{[item['name'] for item in weapons['items'] if item['supplyDrop']]}`",
        f"- 唯一 ID：**{len({item['id'] for item in weapons['items']})} / {len(weapons['items'])}**",
        "- 当前目录采用 Hemlok Breach AR 与 RE-45 Burst；旧 Hemlok Burst AR、RE-45 Auto 作为历史型号不重复计入当前 29 把。",
        "- L-STAR 补给箱状态来自 Season 29 官方补丁；G7 状态沿用 Season 28 官方轮换且 Season 29 未宣布回归地面；Kraber 为长期补给箱武器。",
        "- 数值取自各武器 Wiki 页面固定 revision；多弹丸、充能或特殊弹匣会保留文本，不把复杂机制伪装成单一数字。",
        f"- 来源未给出可比 RPM、因此按 null 处理：`{nullable_rpm}`。",
        "", "## 来源与许可", "", "- Wiki 数据：CC BY-NC-SA 4.0。",
        "- 轮换复核：EA 官方 Season 28 Breach 与 Season 29 Overclocked Patch Notes。",
    ]
    (RESEARCH_DIR / "weapons-audit.md").write_text("\n".join(weapon_text) + "\n")

    status_counts = Counter(item["status"] for item in maps["items"])
    news_category_counts = Counter(item["category"] for item in news["items"])
    maps_news_text = [
        "# 地图与 EA 新闻审计", "", f"核验时间：`{NOW}`", "",
        f"- 地图记录：**{len(maps['items'])}**", f"- 地图状态：`{dict(status_counts)}`",
        "- 地图范围包括 6 张 BR 主地图、Control/Gun Run/TDM/Lockdown 小地图、训练场、历史 Arenas 场地、The Wall 与 Winter Express。",
        "- Current 标记表示当前游戏目录中的地图；赛季内实际轮换会变化，本站不把未获官方快照核实的轮换写成固定事实。",
        "- 同一场地支持多模式时只保留一条记录并合并 mode，避免重复计数。",
        f"- EA 新闻记录：**{len(news['items'])}**", f"- 新闻展示分类：`{dict(news_category_counts)}`",
        f"- EA API 分页列表总数：**{news['meta'].get('totalAvailable')}**；另有 1 条独立 featured，全部按 slug 去重后共收录 **{len(news['items'])}** 条。",
        "- 新闻只保存标题、官方摘要、日期、图片 URL 与原文链接，不复制正文。",
        "- 分类是本站根据标题做的展示归类；EA 原始 type 统一为 News Article，不能误称为 EA 官方分类字段。",
        "", "## 更新机制建议", "",
        "1. 本地或 CI 调用 EA DROP API，按 slug 去重并按 publishingDate 倒序。",
        "2. 仅当生成 JSON 的内容哈希变化时提交并触发 Netlify Production Deploy。",
        "3. Wiki 快照更新时重新执行唯一 ID、必填字段、英雄 28/技能 84、武器 29 的硬校验。",
    ]
    (RESEARCH_DIR / "maps-news-audit.md").write_text("\n".join(maps_news_text) + "\n")


def validate(legends: dict[str, Any], weapons: dict[str, Any], maps: dict[str, Any], news: dict[str, Any]) -> None:
    assert len(legends["items"]) == 28
    assert sum(len(item["abilities"]) for item in legends["items"]) == 84
    assert all({a["type"] for a in item["abilities"]} == {"passive", "tactical", "ultimate"} for item in legends["items"])
    assert len(weapons["items"]) == 29
    assert Counter(item["category"] for item in weapons["items"]) == {"AR": 5, "SMG": 5, "LMG": 4, "Marksman": 4, "Sniper": 4, "Shotgun": 4, "Pistol": 3}
    assert len(maps["items"]) == 34
    assert len(news["items"]) in {news["meta"]["totalAvailable"], news["meta"]["totalAvailable"] + 1}
    for dataset in (legends, weapons, maps, news):
        ids = [item["id"] for item in dataset["items"]]
        assert len(ids) == len(set(ids)), "Duplicate IDs"
        assert dataset["meta"]["count"] == len(dataset["items"])


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RESEARCH_DIR.mkdir(parents=True, exist_ok=True)
    legends = generate_legends()
    weapons = generate_weapons()
    maps = generate_maps()
    news = generate_news()
    validate(legends, weapons, maps, news)
    for name, dataset in (("legends.json", legends), ("weapons.json", weapons), ("maps.json", maps), ("news.json", news)):
        write_json(name, dataset)
    write_audits(legends, weapons, maps, news)
    print(json.dumps({
        "legends": len(legends["items"]),
        "abilities": sum(len(item["abilities"]) for item in legends["items"]),
        "weapons": len(weapons["items"]), "maps": len(maps["items"]), "news": len(news["items"]),
        "generatedAt": NOW,
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"data generation failed: {exc}", file=sys.stderr)
        raise
