# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The personal academic website of Folgert Karsdorp (https://www.karsdorp.io/), built with the [Hugo](https://gohugo.io/) static site generator. `hugo-winston-theme` is still vendored in `themes/` and named in `config.toml`, but every layout, style and script the site uses now lives in the site's own `layouts/` and `assets/` (see "Design system" below). Requires the **extended** Hugo build (≥ 0.55.0). The site is a research blog of statistics/data-science "notebooks" ("Fragments") plus an auto-generated publications list and a LaTeX CV.

## Key commands

```bash
hugo server -D                  # Local preview, including drafts (draft = true)
hugo                            # Build the site into docs/ (the publishDir)
./scripts/new-post.sh <slug>    # Scaffold content/posts/<timestamp>-<slug>.md with front matter
./scripts/generate-references.sh   # Regenerate content/references.md from static/references.bib
./scripts/build-three-vendor.sh    # Rebuild static/js/vendor/three-hero.min.js (needs Node; rarely)
python3 scripts/generate-covers.py # First pages of publication-pdfs/*.pdf → static/images/papers/ + data/covers.json
cd tex && pdflatex main.tex     # Build the CV PDF (tex/main.pdf)
```

`generate-references.sh` requires Python 3 and `pandoc` with citeproc support.

## Architecture notes that aren't obvious from the file tree

- **`docs/` is generated output, not source.** It is Hugo's `publishDir` (set in `config.toml`) and is served as GitHub Pages at the custom domain in `docs/CNAME` (www.karsdorp.io). Never hand-edit `docs/` — edit `content/`, `layouts/`, `assets/`, or `config.toml` and rebuild. Likewise `resources/_gen` is Hugo's cache.

- **The publications page is fully generated; do not edit `content/references.md` by hand.** It is overwritten by `scripts/generate-references.py`. The real source of truth is `static/references.bib`. The Python script parses the BibTeX, splits entries into three buckets — `@book` → Books, `@article` → Journal Articles, everything else → "Conference Papers, Book Chapters, and Other" — and runs each bucket through `pandoc --citeproc` with the Chicago CSL in `static/chicago-date-sorted.csl`. After editing `references.bib`, rerun `generate-references.sh`. The page uses the custom `layouts/_default/pubs.html` layout (selected via `layout = "pubs"` in the generated front matter), whose footer JS rewrites each citation link to a `doi`/`pdf`/`link` tag, bolds the author's name, puts the year in the margin and powers the filter box.

- **"Selected publications" on the homepage is also generated from the `.bib`.** Add `featured = {true}` to an entry in `references.bib` to surface it on the homepage (control order with `featured_order = {N}`, ascending; unordered featured entries fall to the end). The same `generate-references.py` run extracts each featured entry's `title` / venue (`journal`/`booktitle`/`publisher` by type) / `year` / link (`url`, else `doi`) into `data/featured.json` as a list of structured fields — **not** rendered Chicago HTML, deliberately, so it can be shown as a compact flush-left list that respects the homepage's left margin. `layouts/index.html` reads it via `.Site.Data.featured` and ranges over `.entries` (styles under "selected publications" in `assets/css/site.css`; the section hides itself when `count` is 0). Workflow to change featured items: edit the flags in `references.bib` → run `generate-references.sh` → rebuild. Don't hand-edit `data/featured.json`.

- **Posts use TOML front matter (`+++` delimiters), not YAML**, and filenames are timestamp-prefixed (`YYYYMMDDHHMMSS-slug.md`) — a convention carried over from an org-mode/ox-hugo export workflow. Use `new-post.sh` rather than creating files manually so the timestamp and front matter stay consistent. Cross-link between posts with Hugo's `{{< relref "<timestamp>-<slug>.md" >}}` shortcode (see existing posts for examples).

- **Markdown is rendered with `unsafe = true`** (Goldmark), so posts may contain raw HTML and inline `<style>`. Math/figures in older posts come from the ox-hugo pipeline; static assets for posts live under `static/` (`images/`, `videos/`, `ltximg/`, `ox-hugo/`).

- **`tex/main.tex` is a standalone LaTeX CV**, unrelated to the Hugo build; the surrounding `tex/main.{aux,bbl,bcf,...}` are LaTeX build artifacts.

## Design system ("the archive at night")

- **One stylesheet, one base template.** `layouts/_default/baseof.html` replaces the theme's and loads only `assets/css/site.css` (plain CSS, no SCSS) and `assets/js/site.js`. The theme's SCSS, `css/extended/*.css` and scripts are no longer loaded, so editing them does nothing. Colours and type are custom properties at the top of `site.css`: night `--night`, paper `--paper`, links `--lapis`, rubrics `--vermilion`, `--lamp` gold; IM Fell English (display), Newsreader (text), IBM Plex Mono (labels/data), loaded via `params.googleFontsUrl`.
- **Homepage hero** (`#archive`): two versions, picked by `params.hero` in `config.toml` (switch `params.socialImage` with it). Both float ~1,000+ books in the dark with the cursor as a lamp, read the CSS colour tokens in their shaders, and import a tree-shaken three.js subset from `static/js/vendor/three-hero.min.js` (if a hero needs a three.js class not exported there, add it to `scripts/build-three-vendor.sh` and rerun it). Without WebGL both degrade to a static title.
  - `"papers"` (default; `layouts/partials/hero-papers.html`, `assets/js/archive-papers.js`): every lit page is an entry in `data/publications.json`: its first page, floating mostly face-on among the dark books and swaying, shelved left to right by year over a year axis with a small per-year histogram (hovering a year lights its pages). Faces come from one atlas texture built at runtime: tiles cut from `static/images/papers/atlas.jpg` (see `data/covers.json` `tile`) for papers with a PDF, a page typeset on a canvas (venue, title, authors, abstract, greeked body) for the rest; a book without a PDF stays a bound volume with its cloth cover. The page nearest the lamp turns to face you and is catalogued in the card under the title, tied to it by a dotted thread; faint threads run to every book sharing a co-author. Clicking a book (or "Take it out") flies it forward and the card shows the abstract and full author list; Esc puts it back. What flies out is that first page large (a sheet with a few pages behind it: the PDF render from `data/covers.json`, or the typeset page at 1100 px), or for a book a `CanvasTexture` cloth binding with the title in gilt Fell. The open book is in the URL as `#shelf/<bibkey>`, so books can be linked directly. Idle, the lamp tours the shelf. `data/publications.json` (incl. abstracts trimmed to ~720 chars) is written by `generate-references.py` alongside `featured.json` — rerun `generate-references.sh` after editing `references.bib` and the hero follows.
  - `"unseen"` (`layouts/partials/hero-unseen.html`, `assets/js/archive-hero.js`): the Chao1 experiment — ~1,600 copies of ~500 works; the ledger computes S_obs, f1, f2 and bias-corrected Chao1 live; "Light the whole archive" reveals the truth.
- **"Worlds to walk through"** on the homepage comes from `data/worlds.json` (title, subtitle, blurb, meta, action, url, image, alt); the first entry is the large dark lead card. Images live in `static/images/worlds/` (1200×630-ish).
- **First pages come from the PDFs in `publication-pdfs/`** (git-ignored: the PDFs are never published, only the rendered pages). `scripts/generate-covers.py` (needs poppler: `pdftotext`, `pdftoppm`, `pdfinfo`) matches each PDF to an entry in `data/publications.json` by searching its first pages for the title — so a whole journal issue yields the article's page, not the issue cover — renders that page to `static/images/papers/<key>.jpg`, packs all pages small into `static/images/papers/atlas.jpg` (192×272 tiles, needs Pillow) and writes `data/covers.json`. Wrong guesses are fixed in its `OVERRIDES` dict (e.g. an annotated duplicate is skipped; a "how to cite" sheet is skipped in favour of page 2). Workflow: add a PDF → run `generate-references.sh` if the `.bib` changed → `python3 scripts/generate-covers.py` → rebuild.
- **The Publications page is the citation list only, deliberately: no counts or per-year charts** (a bar chart of output per year was tried and removed — the site shouldn't present research as quantity). Its footer JS adds the link labels, the bold name, the year margin and the filter box; the count appears only while filtering.
- **IM Fell's digits are old-style; its `1` reads as a capital I** ("ChaoI"). Titles set in Fell go through `partial "display-title.html"`, which puts digits in Newsreader. Use it for any new Fell-set title that may contain numbers.
- Menu items (Fragments, Worlds, Publications, CV) are `[menu]` in `config.toml`. Homepage tagline is `tagline` in `content/_index.md`; the Fragments intro is `description` in `content/posts/_index.md`.
- `static/demos/coverage-standardization.html` carries its own copy of the paper/ink/lapis tokens and the Fell heading so the embedded demo matches the site; its data colours (A blue, B orange, coverage green) are deliberate and separate.
