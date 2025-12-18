# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an academic website for Folgert Karsdorp, a researcher in Computational Humanities and Cultural Evolution. The site is built with Hugo (static site generator) using the Cactus theme and includes computational notebooks about statistical methods, cultural evolution, and diversity estimation. The site also includes a LaTeX-based CV.

## Development Tools

### Helper Scripts

The `scripts/` directory contains helper scripts for common workflows:

- **`generate-references.sh`**: Generate publications page from BibTeX file
- **`new-post.sh <slug>`**: Create a new blog post with timestamp naming

All scripts can be run directly or via VSCode tasks.

## Key Commands

### Hugo Site Development

```bash
# Build the site (outputs to docs/ directory for GitHub Pages)
hugo

# Run local development server with drafts
hugo server -D

# Run development server (production-like)
hugo server

# Clean build artifacts
rm -rf docs/ resources/_gen/
```

### CV Management

The CV is maintained as a LaTeX document in `tex/main.tex`:

```bash
# Build CV (requires pdflatex and biber)
cd tex
pdflatex main.tex
biber main
pdflatex main.tex
pdflatex main.tex
```

The compiled PDF (`tex/main.pdf`) is linked from the site config and should be committed to the repository.

### Git Workflow

```bash
# Check status (note: references.bib often modified)
git status

# Stage and commit changes
git add <files>
git commit -m "description"

# Push to GitHub (triggers GitHub Pages deployment from docs/)
git push origin master
```

## Architecture

### Content Organization

- **`content/posts/`**: Blog posts/notebooks about statistical methods, diversity estimation, and cultural evolution research
  - Posts use Hugo's TOML front matter with metadata (title, author, date, tags, draft status)
  - Posts often contain mathematical notation (MathJax enabled via `mathjax = true` in config)
  - Cross-references use Hugo's relref syntax: `{{< relref "filename.md" >}}`
  - Posts are titled with dates in format `YYYYMMDDHHMMSS-slug.md`

- **`content/references.md`**: Publications page (16KB markdown file with bibliography)

- **`static/`**: Static assets including:
  - `references.bib`: BibTeX bibliography file (58KB, frequently updated)
  - `chicago-date-sorted.csl`: Citation style for bibliography
  - `ox-hugo/`: Images and assets exported from org-mode
  - `ltximg/`: LaTeX-generated images

- **`data/`**: JSON data files:
  - `projects.json`: Featured research projects displayed on homepage
  - `news.json`: News items (not currently shown: `showNewsList = false`)

### Hugo Configuration

**`config.toml`** key settings:
- `publishDir = "docs"`: Builds to `docs/` for GitHub Pages hosting
- `baseURL = 'https://www.karsdorp.io'`
- `theme = "cactus"`
- Main sections: Home, Notebooks (`/posts`), Publications (`/references`)
- MathJax enabled for mathematical notation in posts
- Shows all posts on homepage (up to 100 posts)
- Color theme: white
- Unsafe markdown rendering enabled for embedded HTML

### LaTeX CV System

**`tex/main.tex`**:
- Custom CV class using `ebgaramond` font
- Uses BibLaTeX with APA style for publications
- Bibliography sourced from `../static/references.bib`
- Sorting: `ydnt` (year descending, name, title)
- Compiled output: `main.pdf` (linked in config at line 104)

### Theme

Uses the **Cactus theme** (in `themes/cactus/`):
- Clean, minimalist design
- Custom layouts in `themes/cactus/layouts/`
- Static assets (JS, CSS) in `themes/cactus/static/`
- Note: `themes/` is in `.gitignore`, so theme is tracked as a submodule or checked in separately

### Build Output

- **`docs/`**: Hugo build output directory
  - Committed to git for GitHub Pages deployment
  - Contains compiled HTML, CSS, JS, and copied static assets
  - Do not manually edit files here

- **`resources/_gen/`**: Hugo-generated SCSS/asset cache
  - Can be safely deleted and regenerated

## Content Authoring Workflow

Content is created directly in VSCode as Markdown files.

### Creating New Blog Posts

Use the provided script to create a new post with proper timestamp naming:

```bash
./scripts/new-post.sh my_post_title
```

This creates a file named `YYYYMMDDHHMMSS-my_post_title.md` in `content/posts/` with proper front matter.

When writing posts:
- Use TOML front matter (delimited by `+++`)
- Include: title, author, date, lastmod, tags, draft status
- For mathematical content, use LaTeX notation (MathJax renders it)
- For citations, use Hugo citation syntax or link to references page
- Cross-reference other posts with `{{< relref "filename.md" >}}`
- Set `draft = false` when ready to publish

### VSCode Tasks

Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to access build tasks:
- **Hugo: Build Site** - Build the static site
- **Hugo: Start Server** - Start development server with live reload
- **Generate Publications Page** - Regenerate publications from BibTeX
- **Build CV** - Compile the LaTeX CV

Or run tasks via Command Palette: `Tasks: Run Task`

## Bibliography Management

The `static/references.bib` file is central to both:
1. Website publications page (`content/references.md`)
2. CV publications section (`tex/main.tex` via BibLaTeX)

### Publications Page Generation

The publications page is generated from the BibTeX file using pandoc and the Chicago CSL style:

```bash
# Generate publications page from BibTeX
./scripts/generate-references.sh
```

Or use the VSCode task: "Generate Publications Page"

This script:
- Reads `static/references.bib`
- Categorizes publications into Books (standalone only), Journal Articles, and Conference Papers/Book Chapters/Other
- Applies `static/chicago-date-sorted.csl` formatting
- Outputs HTML to `content/references.md` with Hugo front matter and section headings
- Automatically updates the `lastmod` timestamp

### Updating Publications

When adding/updating publications:
1. Edit `static/references.bib` (add new entries or update existing)
2. Run `./scripts/generate-references.sh` to regenerate the publications page
3. If needed, rebuild CV: `cd tex && pdflatex main.tex && biber main && pdflatex main.tex`
4. Rebuild Hugo site: `hugo`
5. Commit changes to git

## Common Development Scenarios

**Adding a new blog post:**
```bash
# Create new post with timestamp naming
./scripts/new-post.sh my_topic_name

# Edit the post in VSCode
# Set draft = false when ready to publish

# Preview locally
hugo server -D

# Build and commit
hugo
git add content/posts/ docs/
git commit -m "Add new post: <title>"
git push
```

**Updating publications:**
```bash
# Edit static/references.bib (add/update entries)

# Regenerate publications page
./scripts/generate-references.sh

# If CV needs updating too
cd tex && pdflatex main.tex && biber main && pdflatex main.tex && cd ..

# Rebuild site and commit
hugo
git add static/references.bib content/references.md docs/ tex/main.pdf
git commit -m "Update publications"
git push
```

**Updating CV only:**
```bash
# Edit tex/main.tex
cd tex
pdflatex main.tex
biber main
pdflatex main.tex

# Commit updated PDF
cd ..
git add tex/main.pdf
git commit -m "Update CV"
git push
```

**Updating featured projects:**
```bash
# Edit data/projects.json
# Each project needs: name, url, desc

# Rebuild site
hugo
git add data/projects.json docs/
git commit -m "Update projects"
git push
```
