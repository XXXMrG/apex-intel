#!/usr/bin/env python3
"""Apply the verified Season 30 Marked editorial layer after wiki generation.

This file intentionally keeps launch-day EA facts separate from moving wiki
snapshots. Run after generate-data.py so official patch values, Chinese naming,
corrupted-attachment compatibility, and the frozen perk snapshot are restored.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
RESEARCH = ROOT / "research"
VERSION = "Season 30 · Marked (30.0 launch snapshot)"
FETCHED_AT = "2026-08-06T09:30:00Z"
PATCH_URL = "https://www.ea.com/games/apex-legends/apex-legends/news/marked-patch-notes"


def load(path: Path):
    return json.loads(path.read_text())


def dump(path: Path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def season_override(fields: list[str], note_zh: str) -> dict:
    return {
        "name": "EA Marked Patch Notes",
        "url": PATCH_URL,
        "publishedAt": "2026-08-03",
        "verifiedAt": "2026-08-06",
        "patch": "30.0",
        "fields": fields,
        "noteZh": note_zh,
    }


WEAPON_NAMES = {
    "havoc-rifle": ("哈沃克步枪", ["哈沃克"]),
    "vk-47-flatline": ("VK-47 平行步枪", ["平行步枪", "平行"]),
    "hemlok-breach-ar": ("赫姆洛克突击步枪", ["赫姆洛克"]),
    "r-301-carbine": ("R-301 卡宾枪", ["R301", "301"]),
    "nemesis-burst-ar": ("复仇女神连发突击步枪", ["复仇女神"]),
    "alternator-smg": ("转换者冲锋枪", ["转换者"]),
    "prowler-burst-pdw": ("猎兽冲锋枪", ["猎兽"]),
    "r-99-smg": ("R-99 冲锋枪", ["R99", "99"]),
    "volt-smg": ("电能冲锋枪", ["沃特", "Volt"]),
    "c-a-r-smg": ("C.A.R. 冲锋枪", ["CAR"]),
    "devotion-lmg": ("专注轻机枪", ["专注"]),
    "l-star-emg": ("L-STAR 能量机枪", ["L星"]),
    "m600-spitfire": ("M600 喷火轻机枪", ["喷火"]),
    "rampage-lmg": ("暴走轻机枪", ["暴走"]),
    "g7-scout": ("G7 侦察枪", ["G7"]),
    "triple-take": ("三重式狙击枪", ["三重", "Triple Take"]),
    "30-30-repeater": ("30-30 连发枪", ["3030"]),
    "bocek-compound-bow": ("波塞克复合弓", ["波塞克", "弓"]),
    "charge-rifle": ("充能步枪", ["滋崩"]),
    "longbow-dmr": ("长弓精确步枪", ["长弓"]),
    "kraber-50-cal-sniper": ("克雷贝尔 .50 口径狙击枪", ["克雷贝尔", "大狙"]),
    "sentinel": ("哨兵狙击枪", ["哨兵"]),
    "eva-8-auto": ("EVA-8 自动霰弹枪", ["EVA8"]),
    "mastiff-shotgun": ("獒犬霰弹枪", ["獒犬"]),
    "mozambique-shotgun": ("莫桑比克霰弹枪", ["莫桑比克"]),
    "peacekeeper": ("和平捍卫者", ["PK"]),
    "re-45-burst": ("RE-45 爆裂手枪", ["RE45"]),
    "p2020": ("P2020 半自动手枪", ["2020"]),
    "wingman": ("辅助手枪", ["小帮手", "Wingman"]),
}

MAP_NAMES = {
    "broken-moon": ("残月", ["破碎月亮"]), "e-district": ("电能区", ["电区"]),
    "kings-canyon": ("诸王峡谷", ["王者峡谷", "KC"]), "olympus": ("奥林匹斯", []),
    "storm-point": ("风暴点", []), "world-s-edge": ("世界尽头", ["世界边缘", "WE"]),
    "barometer": ("气压计", []), "caustic-treatment": ("腐蚀疗法", []),
    "hammond-labs": ("哈蒙德实验室", []), "lava-siphon": ("熔岩虹吸", []),
    "production-yard": ("生产庭院", []), "thunderdome": ("雷霆堡", ["雷霆穹顶"]),
    "autumn-estates": ("秋季庄园", []), "fragment-east": ("碎片东部", []),
    "monument": ("纪念碑", []), "skull-town": ("骷髅镇", []),
    "perpetual-core": ("永恒核心", []), "wattson-s-pylon": ("沃特森的拦截塔", []),
    "zeus-station": ("宙斯站", []), "habitat-4": ("4 号栖息地", []),
    "overflow": ("溢出", []), "party-crasher": ("派对破坏者", []),
    "phase-runner": ("相位穿梭器", []), "encore": ("安可", ["返场"]),
    "drop-off": ("装卸区", []), "the-dome": ("圆顶", []),
    "high-desert": ("高漠地", []), "velvet-oasis": ("天鹅绒绿洲", []),
    "artillery-battery": ("火炮", []), "golden-gardens": ("金色花园", []),
    "thermal-station": ("热能站", []), "firing-range": ("射击场", []),
    "the-wall": ("城墙", []), "winter-express": ("冬季快车", []),
}

AMMO_ZH = {
    "Energy Ammo": "能量弹药", "Heavy Rounds": "重型弹药", "Light Rounds": "轻型弹药",
    "Heavy / Light Rounds": "重型／轻型弹药", "Sniper Ammo": "狙击弹药",
    "Shotgun Shells": "霰弹枪弹药", "Arrows": "箭矢", "Supply Drop": "空投专属弹药",
    "Mythic Sniper Ammo": "神话狙击弹药",
}

ATTACHMENT_ZH = {
    "Barrel Stabilizer": "枪管稳定器", "Laser Sight": "激光瞄准器", "Special muzzle module": "专用枪口模块",
    "Extended Light Magazine": "加长式轻型弹匣", "Extended Heavy Magazine": "加长式重型弹匣",
    "Extended Energy Magazine": "加长式能量弹匣", "Extended Sniper Magazine": "加长式狙击弹匣",
    "Extended Light/Heavy Magazine": "加长式轻型／重型弹匣", "Shotgun Bolt": "霰弹枪枪栓",
    "Optics": "瞄准镜", "Standard Stock": "标准枪托", "Sniper Stock": "狙击枪托",
    "Turbocharger": "涡轮增压器", "Accelerator": "加速器", "Elite Hop-Up": "精英即用配件",
    "Double Tap Trigger": "双发扳机", "Selectfire Receiver": "选择射击模式接收器",
    "Gun Shield Generator": "枪盾发生器", "Skullpiercer Rifling": "穿颅器膛线",
    "Disruptor Rounds": "干扰器弹药", "Kinetic Feeder": "动能供弹器", "Graffiti Mod": "涂鸦模组",
}

# Exact values published in the 30.0 patch notes override any launch-day wiki lag.
WEAPON_OVERRIDES = {
    "hemlok-breach-ar": {"body": 21, "head": "官方未公布", "legs": "官方未公布"},
    "alternator-smg": {"body": 18, "head": "官方未公布", "legs": "官方未公布", "magazines": [18, 20, 22, 26]},
    "r-99-smg": {"body": 12, "head": "官方未公布", "legs": "官方未公布"},
    "re-45-burst": {"body": 16, "head": "官方未公布", "legs": "官方未公布", "magazines": [15, 18, 21, 24]},
    "g7-scout": {"body": 33, "head": "官方未公布", "legs": "官方未公布", "magazines": [10, 12, 14, 16], "supply": False},
    "30-30-repeater": {"body": 51, "head": "碎片弹理论 70（56×1.25）", "legs": "官方未公布", "magazines": [50], "supply": True, "stockpile": 50},
    "l-star-emg": {"supply": True},
    "kraber-50-cal-sniper": {"supply": True},
}
RED_MAG_SIZES = {
    # Only values visible on a retained Season 30 in-game comparison card.
    "r-99-smg": 33,
}

UPGRADE_OVERRIDES = {
    "bloodhound": {
        "hidden-sight": "Activating Allfather's Cloak refreshes Eye of the Allfather. Using the tactical while cloaked hides its scan visual from enemies.",
        "bird-s-eye": "White Ravens split and fly toward the two nearest enemies belonging to different squads.",
        "true-predator": "Firing a weapon while cloaked only interrupts the cloak temporarily instead of breaking it permanently. Respawn did not publish the re-cloak delay.",
    },
    "rampart": {
        "combat-reserve": "Gain extra ammo per inventory stack, extra grenade capacity, and automatically reload a stowed weapon. Red Weapon Supply Bin access was removed.",
    },
    "valkyrie": {
        "eyes-in-the-sky": "Reveal enemies through walls within 100 meters while skydiving; enemies in line of sight can still be revealed within 250 meters.",
        "supersonic": "Reduce Skyward Dive launch time by 40% (5.0s → 3.0s).",
    },
}


def apply():
    upgrades = load(RESEARCH / "season30-upgrades.json")
    for item in upgrades["items"]:
        overrides = UPGRADE_OVERRIDES.get(item["legendId"], {})
        for tier in item["tiers"]:
            for option in tier["options"]:
                if option["id"] in overrides:
                    option["description"] = overrides[option["id"]]
    dump(RESEARCH / "season30-upgrades.json", upgrades)
    upgrades_by_id = {item["legendId"]: item for item in upgrades["items"]}
    attachments = load(DATA / "attachments.json")

    legends = load(DATA / "legends.json")
    legends["meta"].update({
        "gameVersion": VERSION, "fetchedAt": FETCHED_AT,
        "sourceName": "EA Marked patch notes + The Apex Legends Wiki",
        "sourceUrl": PATCH_URL,
    })
    for legend in legends["items"]:
        snapshot = upgrades_by_id[legend["id"]]
        legend["upgrades"] = snapshot["tiers"]
        legend["upgradeSource"] = snapshot["source"]
        if legend["id"] in UPGRADE_OVERRIDES:
            fields = ["upgrades"]
            if legend["id"] == "bloodhound":
                fields += ["description", "abilities"]
            legend["seasonOverride"] = season_override(fields, "30.0 官方补丁覆盖 Wiki 快照中的英雄改动字段。")
        if legend["id"] == "axle":
            legend["nameZh"] = "阿克塞尔"
            legend["aliasesZh"] = ["Axle", "艾克索"]
        if legend["id"] == "bloodhound":
            legend["description"] = "A Recon Legend rebuilt for Season 30 as a squad hunter: glowing tracks reveal movement, Eye of the Allfather supplies sustained scans, and Allfather's Cloak conceals the squad."
            by_type = {ability["type"]: ability for ability in legend["abilities"]}
            by_type["passive"].update({"name": "Tracker", "description": "Fresh enemy clues leave red trails. White Ravens can fly up to 400 meters toward nearby enemies and can be activated by looking at them from range."})
            by_type["tactical"].update({"name": "Eye of the Allfather", "description": "Reveal enemies through structures for 3 seconds, followed by four snapshots at 1.5-second intervals.", "cooldown": "25 seconds"})
            by_type["ultimate"].update({"name": "Allfather's Cloak", "description": "Deploy an 8-second device that cloaks every Legend in range, including enemies. Cloak lingers for 12 seconds after leaving, grants +20% movement speed and threat vision, and breaks on damage, weapon fire, or most abilities.", "cooldown": None})
    dump(DATA / "legends.json", legends)
    dump(RESEARCH / "legends.json", legends)

    weapons = load(DATA / "weapons.json")
    weapons["meta"].update({
        "gameVersion": VERSION, "fetchedAt": FETCHED_AT,
        "sourceName": "Wiki stat snapshot + EA Marked 30.0 patch overrides", "sourceUrl": PATCH_URL,
    })
    compat = {}
    for attachment in attachments["items"]:
        for weapon_id in attachment["compatibleWeaponIds"]:
            compat.setdefault(weapon_id, []).append(attachment["id"])
    for weapon in weapons["items"]:
        name_zh, aliases = WEAPON_NAMES[weapon["id"]]
        weapon.update({
            "nameZh": name_zh, "aliasesZh": aliases,
            "ammoZh": AMMO_ZH.get(weapon.get("ammo"), weapon.get("ammo")),
            "attachmentsZh": [ATTACHMENT_ZH.get(name, name) for name in weapon.get("attachments", [])],
            "corruptedAttachmentIds": compat.get(weapon["id"], []),
        })
        weapon.pop("corruptedMagazineSize", None)
        if weapon["id"] in RED_MAG_SIZES:
            weapon["corruptedMagazineSize"] = RED_MAG_SIZES[weapon["id"]]
        override = WEAPON_OVERRIDES.get(weapon["id"], {})
        if "body" in override:
            weapon["damage"]["body"] = override["body"]
            weapon["bodyDamage"] = override["body"]
        if "head" in override:
            weapon["damage"]["head"] = override["head"]
            weapon["headDamage"] = override["head"]
        if "legs" in override:
            weapon["damage"]["legs"] = override["legs"]
            weapon["legDamage"] = override["legs"]
        if "magazines" in override:
            weapon["magazineSizes"] = override["magazines"]
        if "stockpile" in override:
            weapon["stockpileSize"] = override["stockpile"]
        supply = bool(override.get("supply", weapon.get("supplyDrop", False)))
        weapon["supplyDrop"] = supply
        weapon["lootStatus"] = weapon["currentLootTier"] = "空投补给武器" if supply else "地面标准战利品"
        if weapon["id"] in {"hemlok-breach-ar", "alternator-smg", "r-99-smg", "re-45-burst", "g7-scout", "30-30-repeater"}:
            fields = [key for key in override if key in {"body", "head", "legs", "magazines", "supply", "stockpile"}]
            weapon["seasonOverride"] = season_override(fields, "武器字段按 EA 30.0 上线补丁覆盖；未公布的爆头／腿部衍生伤害不冒充官方数值。")
    dump(DATA / "weapons.json", weapons)
    dump(RESEARCH / "weapons.json", weapons)

    maps = load(DATA / "maps.json")
    maps["meta"].update({
        "gameVersion": VERSION, "fetchedAt": FETCHED_AT,
        "sourceName": "Wiki map catalogue + EA Marked map update", "sourceUrl": PATCH_URL,
    })
    for record in maps["items"]:
        name_zh, aliases = MAP_NAMES[record["id"]]
        record["nameZh"] = name_zh
        record["aliasesZh"] = aliases
        record["modeZh"] = "大逃杀" if "Battle Royale" in record["mode"] else "训练" if "Training" in record["mode"] else "竞技场" if "Arenas" in record["mode"] else record["mode"]
        if record["id"] in {"world-s-edge", "storm-point", "e-district"}:
            record["status"] = "Season 30 大逃杀常规轮换"
            record["seasonOverride"] = season_override(["status"], "Season 30 地图池按 EA 30.0 官方补丁记录。")
        elif "Battle Royale" in record["mode"]:
            record["status"] = "当前不在 Season 30 常规大逃杀轮换"
            record["seasonOverride"] = season_override(["status"], "Season 30 地图池按 EA 30.0 官方补丁记录。")
        if record["id"] == "world-s-edge":
            record["status"] = "Season 30 常规轮换 · 重点重制"
            record["descriptionZh"] = "第 30 赛季转为极光夜景；新增东部聚落、战场营地与树木聚落，分拣工厂和建筑工地回归，大莫德移动至山崩上方。"
            record["seasonOverride"] = season_override(["nameZh", "aliasesZh", "status", "descriptionZh"], "世界尽头夜间重制按 EA 30.0 官方补丁记录。")
    dump(DATA / "maps.json", maps)
    dump(RESEARCH / "maps.json", maps)

    # Translation ledgers retain name policy beside existing descriptions.
    wt = load(DATA / "translations-weapons.zh-CN.json")
    mt = load(DATA / "translations-maps.zh-CN.json")
    for key, (name, aliases) in WEAPON_NAMES.items():
        wt.setdefault(key, {}).update({"nameZh": name, "aliasesZh": aliases})
    for key, (name, aliases) in MAP_NAMES.items():
        mt.setdefault(key, {}).update({"nameZh": name, "aliasesZh": aliases})
    dump(DATA / "translations-weapons.zh-CN.json", wt)
    dump(DATA / "translations-maps.zh-CN.json", mt)

    print(f"Applied {VERSION}: {len(legends['items'])} legends / {upgrades['meta']['count']} upgrades / {len(weapons['items'])} weapons / {len(attachments['items'])} corrupted attachments / {len(maps['items'])} maps")


if __name__ == "__main__":
    apply()
