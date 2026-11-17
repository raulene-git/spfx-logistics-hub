"""Draws the Fieldnotes toolbox icons and writes them into the web part manifests.

Each icon is a green tile with a cream line drawing and the yellow square from the logo.
They go in as iconImageUrl data URIs, so they show in the toolbox with no extra hosting.
SVG copies are saved to assets/toolbox/. Every web part goes in one "Fieldnotes" toolbox group.

Run:  python scripts/make-toolbox-icons.py
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
GROUP_ID = "aec813ce-7240-4750-9bbd-55ddfb138d5a"
GROUP_NAME = "Fieldnotes"

# Line drawings on a 24x24 grid.
GLYPHS = {
    "hero": '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    "callout": '<path d="M3 10v4h3l8 5V5l-8 5z"/><path d="M18 9a4 4 0 010 6M20.5 6.5a7.5 7.5 0 010 11"/>',
    "discover": '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    "quicklinks": '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    "news": '<rect x="3" y="5" width="18" height="14"/><path d="M7 9h4v3H7zM14 9h3M14 12h3M7 16h10"/>',
    "comingup": '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>',
    "sayhello": '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M18 8v6M15 11h6"/>',
    "dispatch": '<rect x="3" y="7" width="13" height="10"/><path d="M16 10h3l2 3v4h-5"/><circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>',
    "snapshot": '<path d="M3 21h18M6 17v-5M11 17V6M16 17v-8"/>',
    "importer": '<path d="M6 3h9l4 4v14H6z"/><path d="M12 18v-7M9.5 13.5L12 11l2.5 2.5"/>',
}

# Which icon replaces which placeholder Fluent icon name in the manifests.
BY_FLUENT_NAME = {
    "Sunny": "hero",
    "Megaphone": "callout",
    "Compass": "discover",
    "Link": "quicklinks",
    "News": "news",
    "Calendar": "comingup",
    "AddFriend": "sayhello",
    "DeliveryTruck": "dispatch",
    "Dashboard": "snapshot",
    "ExcelDocument": "importer",
}


def svg(glyph: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">'
        '<rect width="40" height="40" rx="9" fill="#1E5B43"/>'
        '<g transform="translate(8 8)" fill="none" stroke="#F7F4EC" stroke-width="1.8" '
        f'stroke-linecap="round" stroke-linejoin="round">{glyph}</g>'
        '<rect x="31" y="31" width="4" height="4" fill="#FFD957"/>'
        "</svg>"
    )


def data_uri(markup: str) -> str:
    return "data:image/svg+xml;base64," + base64.b64encode(markup.encode("utf-8")).decode("ascii")


def main() -> None:
    out = ROOT / "assets" / "toolbox"
    out.mkdir(parents=True, exist_ok=True)
    uris = {}
    for name, glyph in GLYPHS.items():
        markup = svg(glyph)
        (out / f"{name}.svg").write_text(markup, encoding="utf-8")
        uris[name] = data_uri(markup)

    for manifest in sorted((ROOT / "src" / "webparts").glob("*/*.manifest.json")):
        text = manifest.read_text(encoding="utf-8")
        text = re.sub(
            r'"officeFabricIconFontName": "(\w+)"',
            lambda m: f'"iconImageUrl": "{uris[BY_FLUENT_NAME[m.group(1)]]}"',
            text,
        )
        text = re.sub(r'"groupId": "[0-9a-f-]+"', f'"groupId": "{GROUP_ID}"', text)
        text = re.sub(r'"group": \{ "default": "[^"]*" \}', f'"group": {{ "default": "{GROUP_NAME}" }}', text)
        manifest.write_text(text, encoding="utf-8")
        print(f"Updated {manifest.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
