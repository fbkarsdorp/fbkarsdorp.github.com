#!/usr/bin/env python3
"""
Render the first page of each paper in publication-pdfs/ as an image, for the
homepage hero: the pages floating in the dark and the page you take out.

Each PDF is matched to an entry in data/publications.json (run
generate-references.sh first) by its title, searched for in the PDF's first
few pages — so a PDF of a whole journal issue still yields the article's own
first page, not the issue cover. Writes:

  static/images/papers/<key>.jpg        the page, ~1400 px tall
  static/images/papers/atlas.jpg        every page small, in one image (the floating pages)
  data/covers.json                      {bibkey: {page, tile, aspect, source, pdfPage}}

Requires poppler (pdftotext, pdftoppm, pdfinfo) and Pillow. The PDFs themselves are not
published; only these images are.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_DIR = Path(__file__).parent.parent
PDF_DIR = PROJECT_DIR / "publication-pdfs"
PUBLICATIONS = PROJECT_DIR / "data" / "publications.json"
OUT_DIR = PROJECT_DIR / "static" / "images" / "papers"
COVERS = PROJECT_DIR / "data" / "covers.json"

PAGE_HEIGHT = 1400
TILE = (192, 272)        # one page in the atlas (pages are stretched to it; the hero restores the aspect)
ATLAS_COLS = 8
SEARCH_PAGES = 6

# Matches the automatic search gets wrong: {pdf filename: (bibkey, page)}.
# Use a bibkey of None to skip a PDF.
OVERRIDES = {
    # an annotated (reMarkable) copy of the RSIF paper; the clean PDF is there too
    'zot2rm-H4HBBD6K-1786961587604.pdf': (None, None),
    # page 1 is the Open Library of Humanities "how to cite" sheet
    'Haverals and Kestemont - 2019 - Data-Driven Syllabification for Middle Dutch.pdf': ('2019h:haverals_syllables', 2),
}


def normalize(text):
    return re.sub(r'[^a-z0-9]+', '', text.lower())


def words(text):
    return {w for w in re.findall(r'[a-z0-9]+', text.lower()) if len(w) > 2}


def run(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout


def page_count(pdf):
    m = re.search(r'^Pages:\s+(\d+)', run('pdfinfo', str(pdf)), re.MULTILINE)
    return int(m.group(1)) if m else 1


def page_aspect(pdf, page):
    """Width / height of one page's crop box (print PDFs carry bleed and crop
    marks outside it), in points."""
    out = run('pdfinfo', '-box', '-f', str(page), '-l', str(page), str(pdf))
    m = re.search(r'CropBox:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)', out)
    if not m:
        return 0.7071
    x0, y0, x1, y1 = map(float, m.groups())
    return round((x1 - x0) / (y1 - y0), 4)


def page_text(pdf, page):
    try:
        return run('pdftotext', '-f', str(page), '-l', str(page), str(pdf), '-')
    except subprocess.CalledProcessError:
        return ''


def match(pdf, entries):
    """(entry, page, score): the best-matching entry, on the earliest page that
    matches it nearly as well as any (a published title can differ from the
    .bib one, and the abstract on page 2 may then score a little higher)."""
    first = best_match(pdf, entries)
    entry, _, score = first
    if not entry or score >= 1.0:
        return first
    for page in range(1, min(SEARCH_PAGES, page_count(pdf)) + 1):
        e, _, s = best_match(pdf, [entry], pages=[page])
        if s >= max(0.6, score - 0.3):
            return entry, page, s
    return first


def best_match(pdf, entries, pages=None):
    """(entry, page, score) for the best title match in the first pages."""
    best = (None, 1, 0.0)
    for page in pages or range(1, min(SEARCH_PAGES, page_count(pdf)) + 1):
        text = page_text(pdf, page)
        flat, bag = normalize(text), words(text)
        for e in entries:
            title = e['title'] or ''
            head = normalize(title)[:40]
            if len(head) >= 16 and head in flat:
                score = 1.0                                     # the title, verbatim
            else:
                tw = words(title)
                score = len(tw & bag) / len(tw) if tw else 0    # most of its words
                # a long run of the title's first words counts nearly as much
                lead = normalize(' '.join(title.split()[:5]))
                if len(lead) >= 14 and lead in flat:
                    score = max(score, 0.9)
            if score > best[2]:
                best = (e, page, score)
        if best[2] >= 1.0:
            break
    return best


def render(pdf, page, out, height):
    stem = str(out.with_suffix(''))
    run('pdftoppm', '-f', str(page), '-l', str(page), '-singlefile', '-cropbox',
        '-jpeg', '-jpegopt', 'quality=82,progressive=y,optimize=y',
        '-scale-to-y', str(height), '-scale-to-x', '-1', str(pdf), stem)


def main():
    entries = json.loads(PUBLICATIONS.read_text())['entries']
    pdfs = sorted(PDF_DIR.glob('*.pdf'))
    if not pdfs:
        sys.exit(f"No PDFs in {PDF_DIR}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    chosen = {}                  # bibkey -> (pdf, page, score)
    unmatched = []
    for pdf in pdfs:
        if pdf.name in OVERRIDES:
            key, page = OVERRIDES[pdf.name]
            if key:
                chosen[key] = (pdf, page, 2.0)
            continue
        entry, page, score = match(pdf, entries)
        if not entry or score < 0.6:
            unmatched.append((pdf.name, entry['title'] if entry else None, score))
            continue
        key = entry['key']
        # Two PDFs of one paper: keep the better match, then the newer file.
        prev = chosen.get(key)
        if prev and (prev[2], prev[0].stat().st_mtime) >= (score, pdf.stat().st_mtime):
            continue
        chosen[key] = (pdf, page, score)

    covers = {}
    for key, (pdf, page, score) in sorted(chosen.items()):
        slug = re.sub(r'[^A-Za-z0-9_-]+', '-', key)
        render(pdf, page, OUT_DIR / f"{slug}.jpg", PAGE_HEIGHT)
        covers[key] = {
            'page': f"images/papers/{slug}.jpg",
            'aspect': page_aspect(pdf, page),
            'source': pdf.name,
            'pdfPage': page,
        }
        print(f"  {key:42s} p.{page}  {score:.2f}  {pdf.name}")

    # The atlas: every page small, in one image, so the hero loads one file.
    atlas = Image.new('RGB', (TILE[0] * ATLAS_COLS, TILE[1] * -(-len(covers) // ATLAS_COLS)), '#f3f2ed')
    for n, c in enumerate(covers.values()):
        x, y = (n % ATLAS_COLS) * TILE[0], (n // ATLAS_COLS) * TILE[1]
        with Image.open(PROJECT_DIR / 'static' / c['page']) as page:
            atlas.paste(page.convert('RGB').resize(TILE, Image.LANCZOS), (x, y))
        c['tile'] = [x, y, *TILE]
    atlas.save(OUT_DIR / 'atlas.jpg', quality=84, optimize=True, progressive=True)

    # Images whose paper is gone from the bib or the folder.
    keep = {Path(c['page']).name for c in covers.values()} | {'atlas.jpg'}
    for img in OUT_DIR.glob('*.jpg'):
        if img.name not in keep:
            img.unlink()

    COVERS.write_text(json.dumps(covers, indent=2, ensure_ascii=False) + '\n')
    print(f"✓ {len(covers)} first pages → {OUT_DIR.relative_to(PROJECT_DIR)}, {COVERS.relative_to(PROJECT_DIR)}")
    for name, title, score in unmatched:
        print(f"  ! not matched ({score:.2f}): {name}" + (f"  [closest: {title}]" if title else ''))
    missing = [e['title'] for e in entries if e['key'] not in covers]
    print(f"  {len(missing)} publications have no PDF (the hero typesets their first page; books keep a cloth binding)")


if __name__ == '__main__':
    main()
