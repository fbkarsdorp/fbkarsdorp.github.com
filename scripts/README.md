# Helper Scripts

This directory contains shell scripts to streamline common development tasks.

## Available Scripts

### `generate-references.sh`

Generates the publications page from the BibTeX bibliography.

**Usage:**
```bash
./scripts/generate-references.sh
```

**What it does:**
- Reads `static/references.bib`
- Categorizes entries into three sections:
  - **Books**: @book (standalone books only)
  - **Journal Articles**: @article
  - **Conference Papers, Book Chapters, and Other**: @inproceedings, @incollection, @inbook, @misc, @unpublished, etc.
- Applies Chicago style formatting via `static/chicago-date-sorted.csl`
- Generates HTML bibliography with proper Hugo front matter and section headings
- Outputs to `content/references.md`
- Updates the `lastmod` timestamp automatically

**Requirements:**
- Python 3
- pandoc with citeproc support

**When to use:**
- After adding or updating entries in `static/references.bib`
- When the publications page needs to be refreshed

---

### `new-post.sh`

Creates a new blog post with proper timestamp naming and front matter.

**Usage:**
```bash
./scripts/new-post.sh <slug>
```

**Example:**
```bash
./scripts/new-post.sh diversity_estimation
```

Creates: `content/posts/20251215121500-diversity_estimation.md`

**What it does:**
- Generates timestamp in format `YYYYMMDDHHMMSS`
- Creates filename: `<timestamp>-<slug>.md`
- Adds Hugo front matter (TOML format) with:
  - Title placeholder
  - Author: Folgert Karsdorp
  - Current date/time
  - Empty tags array
  - draft = true
- Places file in `content/posts/`

**Next steps after running:**
1. Open the created file
2. Edit the title
3. Write your content
4. Add relevant tags
5. Set `draft = false` when ready to publish
6. Preview with `hugo server -D`

---

## VSCode Integration

All scripts are accessible via VSCode tasks (press `Cmd+Shift+B` or `Ctrl+Shift+B`):
- Generate Publications Page
- Hugo: Build Site
- Hugo: Start Server
- Build CV

See `.vscode/tasks.json` for task definitions.
