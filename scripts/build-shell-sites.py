#!/usr/bin/env python3
"""Generate mobile/index.html and desk/index.html from root index.html."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "index.html"
BUILD = ROOT / "build.json"


def build_version() -> str:
    try:
        import json

        return str(json.loads(BUILD.read_text()).get("version") or "218")
    except Exception:
        return "218"


def rewrite_asset_paths(html: str) -> str:
    """Point shell pages at parent-dir assets."""
    # href/src without leading http, /, or ../
    def repl_attr(match: re.Match[str]) -> str:
        attr, quote, path = match.group(1), match.group(2), match.group(3)
        if path.startswith(("http://", "https://", "/", "../", "data:", "#", "mailto:")):
            return match.group(0)
        return f"{attr}={quote}../{path}{quote}"

    html = re.sub(
        r"""\b(href|src)=(["'])(?!https?:|//|data:|#|mailto:|\.\./|/)([^"']+)\2""",
        repl_attr,
        html,
        flags=re.I,
    )
    return html


def inject_shell(html: str, shell: str, ver: str) -> str:
    # Absolute paths so /m/ and /desk/ aliases still resolve assets
    # (relative mobile.css under /m/ would request /m/mobile.css → 404).
    if shell == "m":
        extra_css = "/mobile/mobile.css"
        extra_css_more = "/mobile/m-ui.css"
        extra_js = "/mobile/mobile-app.js"
        label = "Mobile"
    elif shell == "school":
        extra_css = "/school/school.css"
        extra_js = "/school/school-app.js"
        label = "School"
    else:
        extra_css = "/desk/desk.css"
        extra_js = "/desk/desk-app.js"
        label = "Desktop"
    head_bits = f"""
<meta name="paidia-shell" content="{shell}">
<script>document.documentElement.dataset.shell="{shell}";window.__PAIDIA_SHELL__="{shell}";</script>
"""
    html = html.replace("<head>", "<head>\n" + head_bits, 1)
    # Load shell CSS last so it wins over ui-v110/ui-v213
    shell_css = f'<link rel="stylesheet" href="{extra_css}?v={ver}">\n'
    if shell == "m":
        shell_css += f'<link rel="stylesheet" href="{extra_css_more}?v={ver}">\n'
    if "</head>" in html:
        html = html.replace("</head>", shell_css + "</head>", 1)
    else:
        html = html.replace("<head>\n" + head_bits, "<head>\n" + head_bits + shell_css, 1)
    # Body class lock — merge into existing class attribute when present
    def body_repl(match: re.Match[str]) -> str:
        attrs = match.group(1) or ""
        shell_cls = f"shell-{shell} paidia-shell"
        if re.search(r'\bclass\s*=', attrs, flags=re.I):
            attrs = re.sub(
                r'\bclass=(["\'])(.*?)\1',
                lambda m: f'class={m.group(1)}{m.group(2)} {shell_cls}{m.group(1)}',
                attrs,
                count=1,
                flags=re.I,
            )
        else:
            attrs = f' class="{shell_cls}"' + attrs
        if 'data-shell=' not in attrs:
            attrs += f' data-shell="{shell}"'
        return f"<body{attrs}>"

    html = re.sub(r"<body([^>]*)>", body_repl, html, count=1, flags=re.I)
    # Replace gate boot scripts: shared boot then shell app (no root gate.js auto-start as primary)
    boot = f"""
<script src="../shared/shell.js?v={ver}"></script>
<script src="../shared/core.js?v={ver}"></script>
<script src="../shared/i18n.js?v={ver}"></script>
<script src="../shared/ops.js?v={ver}"></script>
<script src="../shared/dirty.js?v={ver}"></script>
<script src="../shared/bridge.js?v={ver}"></script>
<script src="{extra_js}?v={ver}"></script>
<script src="../gate.js?v={ver}"></script>
<script src="../page-tips.js?v={ver}" async></script>
<script src="../zoai-tips.js?v={ver}" async></script>
<script src="../notifications.js?v={ver}" async></script>
"""
    html = re.sub(
        r"<script>\s*/\* Gate FIRST[\s\S]*?</script>\s*"
        r'<script src="[^"]*gate\.js[^"]*"></script>\s*'
        r'<script src="[^"]*page-tips\.js[^"]*"[^>]*></script>\s*'
        r'<script src="[^"]*zoai-tips\.js[^"]*"[^>]*></script>\s*'
        r'<script src="[^"]*notifications\.js[^"]*"[^>]*></script>\s*',
        boot,
        html,
        count=1,
        flags=re.I,
    )
    # Title (label already set above for m / desk / school)
    html = html.replace("<title>Armonia Thassos</title>", f"<title>Armonia Thassos · {label}</title>", 1)
    return html


def main() -> None:
    ver = build_version()
    raw = SRC.read_text(encoding="utf-8")
    for shell, folder in (("m", "mobile"), ("desk", "desk"), ("school", "school")):
        html = rewrite_asset_paths(raw)
        html = inject_shell(html, shell, ver)
        out = ROOT / folder / "index.html"
        out.write_text(html, encoding="utf-8")
        print(f"wrote {out.relative_to(ROOT)} ({len(html)} bytes, v{ver})")


if __name__ == "__main__":
    main()
