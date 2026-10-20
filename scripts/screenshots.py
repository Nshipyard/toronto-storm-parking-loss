#!/usr/bin/env python3
"""Screenshot recipe (from AGENTS.md): Python Playwright + page.set_content()
with the built CSS inlined as a <style> tag, reading the prerendered
.next/server/app/index.html. Sandbox Chromium cannot tunnel external HTTPS,
and loopback navigation is blocked, so the static recipe is the way.
The page is server-rendered with real data, so set_content shows it fully."""
import glob
import re
import sys

BASE = "/home/hatch/workspace/nshipyard-builds/toronto-storm-parking-loss"


def main():
    html = open(f"{BASE}/.next/server/app/index.html", encoding="utf-8").read()
    css_files = glob.glob(f"{BASE}/.next/static/**/*.css", recursive=True)
    css = "\n".join(open(f, encoding="utf-8", errors="replace").read() for f in css_files)
    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', "", html)
    html = html.replace("</head>", f"<style>{css}</style></head>", 1)

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-gpu", "--no-sandbox"])
        shots = [
            ("storm-desktop-top.png", 1440, 900, None),
            ("storm-desktop-explorer.png", 1440, 900, "storms"),
            ("storm-desktop-chart.png", 1440, 900, "chart"),
            ("storm-mobile-top.png", 390, 844, None),
            ("storm-mobile-explorer.png", 390, 844, "storms"),
        ]
        for name, w, h, anchor in shots:
            page = browser.new_page(viewport={"width": w, "height": h})
            page.set_content(html, wait_until="load")
            page.wait_for_timeout(900)
            if anchor:
                el = page.query_selector(f"#{anchor}")
                if el:
                    el.scroll_into_view_if_needed()
                    page.wait_for_timeout(400)
            page.screenshot(path=f"{BASE}/docs/screenshots/{name}")
            overflow = page.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth")
            print("shot", name, "h-overflow px:", overflow)
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
