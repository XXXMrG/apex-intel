#!/usr/bin/env python3
"""Synchronize audited Apex entity media from The Apex Legends Wiki.

The checked-in output is served by Netlify from public/media/apex. Runtime pages never
scrape or hotlink wiki files. Raster sources are requested as 1000 px thumbnails and
converted to WebP when cwebp is available; SVG icons are preserved as SVG.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import mwparserfromhell

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data"
PUBLIC_DIR = ROOT / "public" / "media" / "apex"
MANIFEST_PATH = DATA_DIR / "media-manifest.json"
WIKI_API = "https://apexlegends.wiki.gg/api.php"
WIKI_HOME = "https://apexlegends.wiki.gg/"
USER_AGENT = "ApexIntelMediaSync/0.1 (+https://github.com/XXXMrG/apex-intel)"
RIGHTS_NOTICE = "Game artwork © Electronic Arts / Respawn; source file hosted by The Apex Legends Wiki"
NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

ATTACHMENT_FILES = {
    "Accelerator": "Accelerator.svg",
    "Barrel Stabilizer": "Barrel Stabilizer.svg",
    "Disruptor Rounds": "Disruptor Rounds.svg",
    "Double Tap Trigger": "Double Tap Trigger.svg",
    "Elite Hop-Up": "Hop-Up Attachment.svg",
    "Extended Energy Magazine": "Extended Energy Mag.svg",
    "Extended Heavy Magazine": "Extended Heavy Mag.svg",
    "Extended Light Magazine": "Extended Light Mag.svg",
    "Extended Light/Heavy Magazine": "Mag Attachment CAR.svg",
    "Extended Sniper Magazine": "Extended Sniper Mag.svg",
    "Graffiti Mod": "Graffiti Mod.svg",
    "Gun Shield Generator": "Gun Shield Generator.svg",
    "Kinetic Feeder": "Kinetic Feeder.svg",
    "Laser Sight": "Laser Sight.svg",
    "Optics": "Optics Attachment.svg",
    "Selectfire Receiver": "Selectfire Receiver.svg",
    "Shotgun Bolt": "Shotgun Bolt.svg",
    "Skullpiercer Rifling": "Skullpiercer Rifling.svg",
    "Sniper Stock": "Sniper Stock.svg",
    "Special muzzle module": "Barrel Attachment.svg",
    "Standard Stock": "Standard Stock.svg",
    "Turbocharger": "Turbocharger.svg",
}

WEAPON_FILE_OVERRIDES = {
    "re-45-burst": "RE-45 Auto.png",
}

MAP_FILE_OVERRIDES = {
    "monument": "S17 monument 2.jpg",
    "winter-express": "Winter Express Icon.png",
}


def api_json(params: dict[str, Any]) -> dict[str, Any]:
    url = f"{WIKI_API}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.load(response)


def batched(values: list[str], size: int = 40):
    for index in range(0, len(values), size):
        yield values[index:index + size]


def source_title(source_url: str) -> str:
    encoded = source_url.split("/wiki/", 1)[-1]
    return urllib.parse.unquote(encoded).replace("_", " ")


def extract_map_files(map_items: list[dict[str, Any]]) -> dict[str, str]:
    requested = {item["id"]: source_title(item["source"]["url"]) for item in map_items}
    pages: dict[str, dict[str, Any]] = {}
    for titles in batched(list(requested.values())):
        data = api_json({
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "prop": "revisions",
            "rvprop": "content",
            "rvslots": "main",
            "titles": "|".join(titles),
        })
        for page in data["query"]["pages"]:
            pages[page["title"]] = page

    output: dict[str, str] = {}
    for item_id, title in requested.items():
        if item_id in MAP_FILE_OVERRIDES:
            output[item_id] = MAP_FILE_OVERRIDES[item_id]
            continue
        page = pages.get(title)
        if not page or "revisions" not in page:
            raise RuntimeError(f"Map page missing or unreadable: {title}")
        wikitext = page["revisions"][0]["slots"]["main"]["content"]
        code = mwparserfromhell.parse(wikitext)
        filename = ""
        for template in code.filter_templates(recursive=False):
            if str(template.name).strip().lower().replace("-", " ") != "infobox map":
                continue
            for parameter in template.params:
                if str(parameter.name).strip() == "image":
                    filename = str(parameter.value).strip()
                    break
            break
        if not filename:
            raise RuntimeError(f"Map infobox image missing: {title}")
        output[item_id] = filename
    return output


def query_image_info(filenames: list[str], thumb_width: int = 1000) -> dict[str, dict[str, Any]]:
    output: dict[str, dict[str, Any]] = {}
    titles = [f"File:{filename}" for filename in filenames]
    for title_batch in batched(titles):
        data = api_json({
            "action": "query",
            "format": "json",
            "formatversion": 2,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|sha1",
            "iiurlwidth": thumb_width,
            "titles": "|".join(title_batch),
        })
        for page in data["query"]["pages"]:
            info = (page.get("imageinfo") or [None])[0]
            if not info:
                raise RuntimeError(f"Wiki file missing: {page['title']}")
            output[page["title"].removeprefix("File:")] = info
    return output


def safe_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def file_page_url(filename: str) -> str:
    quoted = urllib.parse.quote(f"File:{filename}".replace(" ", "_"), safe="/:()'.,-")
    return f"https://apexlegends.wiki.gg/wiki/{quoted}"


def fetch_bytes(url: str) -> bytes:
    last_error: Exception | None = None
    for _ in range(3):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/avif,image/webp,image/*,*/*"})
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except Exception as error:  # network/CDN retries are intentionally broad here
            last_error = error
    raise RuntimeError(f"Failed to download media after 3 attempts: {url}") from last_error


def write_asset(filename: str, destination_stem: Path, info: dict[str, Any]) -> tuple[Path, str]:
    mime = info.get("mime", "")
    is_svg = mime == "image/svg+xml" or filename.lower().endswith(".svg")
    download_url = info["url"] if is_svg else info.get("thumburl") or info["url"]
    payload = fetch_bytes(download_url)
    destination_stem.parent.mkdir(parents=True, exist_ok=True)

    if is_svg:
        destination = destination_stem.with_suffix(".svg")
        text = payload.decode("utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
        normalized = "\n".join(line.rstrip() for line in text.split("\n")).strip() + "\n"
        destination.write_text(normalized, encoding="utf-8")
    else:
        cwebp = shutil.which("cwebp")
        if not cwebp:
            raise RuntimeError("cwebp is required to synchronize optimized raster media")
        source_suffix = Path(urllib.parse.urlsplit(info["url"]).path).suffix or ".img"
        with tempfile.NamedTemporaryFile(suffix=source_suffix) as source:
            source.write(payload)
            source.flush()
            destination = destination_stem.with_suffix(".webp")
            subprocess.run(
                [cwebp, "-quiet", "-mt", "-q", "82", source.name, "-o", str(destination)],
                check=True,
            )
    local_sha256 = hashlib.sha256(destination.read_bytes()).hexdigest()
    return destination, local_sha256


def media_record(filename: str, relative_path: str, info: dict[str, Any], local_sha256: str) -> dict[str, Any]:
    return {
        "src": f"/media/apex/{relative_path}",
        "sourceFile": filename,
        "sourceUrl": file_page_url(filename),
        "sourceSha1": info["sha1"],
        "localSha256": local_sha256,
        "width": info["width"],
        "height": info["height"],
        "rights": RIGHTS_NOTICE,
    }


def main() -> None:
    legends = json.loads((DATA_DIR / "legends.json").read_text())["items"]
    weapons = json.loads((DATA_DIR / "weapons.json").read_text())["items"]
    maps = json.loads((DATA_DIR / "maps.json").read_text())["items"]

    map_files = extract_map_files(maps)
    legend_files = {item["id"]: f"{item['name']}.jpg" for item in legends}
    ability_files = {
        ability["id"]: f"{ability['name']}.svg"
        for legend in legends
        for ability in legend["abilities"]
    }
    weapon_files = {
        item["id"]: WEAPON_FILE_OVERRIDES.get(item["id"], f"{item['name']}.png")
        for item in weapons
    }
    attachment_files = dict(ATTACHMENT_FILES)

    all_filenames = list(dict.fromkeys(
        list(legend_files.values())
        + list(ability_files.values())
        + list(weapon_files.values())
        + list(map_files.values())
        + list(attachment_files.values())
    ))
    image_info = query_image_info(all_filenames)

    if PUBLIC_DIR.exists():
        shutil.rmtree(PUBLIC_DIR)
    PUBLIC_DIR.mkdir(parents=True)

    manifest: dict[str, Any] = {
        "meta": {
            "generatedAt": NOW,
            "sourceName": "The Apex Legends Wiki file archive",
            "sourceUrl": WIKI_HOME,
            "rights": RIGHTS_NOTICE,
            "runtimeHotlinks": False,
        },
        "legends": {},
        "abilities": {},
        "weapons": {},
        "maps": {},
        "attachments": {},
    }

    def sync_asset(job: tuple[str, str, str, str, str]) -> tuple[str, str, dict[str, Any]]:
        group, key, filename, folder, stem = job
        info = image_info[filename]
        destination, local_sha256 = write_asset(filename, PUBLIC_DIR / folder / stem, info)
        relative = destination.relative_to(PUBLIC_DIR).as_posix()
        return group, key, media_record(filename, relative, info, local_sha256)

    jobs = (
        [("legends", item_id, filename, "legends", item_id) for item_id, filename in legend_files.items()]
        + [("abilities", ability_id, filename, "abilities", ability_id) for ability_id, filename in ability_files.items()]
        + [("weapons", item_id, filename, "weapons", item_id) for item_id, filename in weapon_files.items()]
        + [("maps", item_id, filename, "maps", item_id) for item_id, filename in map_files.items()]
        + [("attachments", label, filename, "attachments", safe_slug(label)) for label, filename in attachment_files.items()]
    )
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(sync_asset, job) for job in jobs]
        for future in as_completed(futures):
            group, key, record = future.result()
            manifest[group][key] = record

    for group in ("legends", "abilities", "weapons", "maps", "attachments"):
        manifest[group] = dict(sorted(manifest[group].items()))

    manifest["meta"]["counts"] = {
        group: len(manifest[group])
        for group in ("legends", "abilities", "weapons", "maps", "attachments")
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    total_files = sum(manifest["meta"]["counts"].values())
    total_bytes = sum(path.stat().st_size for path in PUBLIC_DIR.rglob("*") if path.is_file())
    duplicate_groups: dict[str, list[str]] = {}
    by_hash: dict[str, list[str]] = {}
    for group in ("legends", "abilities", "weapons", "maps", "attachments"):
        for key, record in manifest[group].items():
            by_hash.setdefault(record["localSha256"], []).append(f"{group}/{key}")
    duplicate_groups = {digest: refs for digest, refs in by_hash.items() if len(refs) > 1}

    print(json.dumps({
        "manifest": str(MANIFEST_PATH),
        "files": total_files,
        "bytes": total_bytes,
        "counts": manifest["meta"]["counts"],
        "duplicateGroups": duplicate_groups,
        "runtimeHotlinks": False,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
