#!/usr/bin/env python3
"""
Generate publications page from BibTeX file, organized by type.
"""

import json
import re
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# Get project directory
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent

# Paths
BIB_FILE = PROJECT_DIR / "static" / "references.bib"
CSL_FILE = PROJECT_DIR / "static" / "chicago-date-sorted.csl"
OUTPUT = PROJECT_DIR / "content" / "references.md"
# Consumed by the homepage template (layouts/index.html) to render the
# "Selected publications" section. Mark entries with `featured = {true}` in
# references.bib; control ordering with `featured_order = {N}` (ascending).
FEATURED_OUTPUT = PROJECT_DIR / "data" / "featured.json"

# Entry type mappings
BOOKS = {'book'}  # Only standalone books
ARTICLES = {'article'}  # Journal articles
# Everything else goes to "other": inproceedings, incollection, inbook, misc, unpublished, etc.


# `featured = {true}` marks an entry for the homepage; `featured_order = {N}`
# sets its position (ascending). The negative lookbehind keeps `featured_order`
# from matching the bare `featured` field.
FEATURED_RE = re.compile(r'(?<![_\w])featured\s*=\s*[{"]?\s*(true|yes|1)\b', re.IGNORECASE)
FEATURED_ORDER_RE = re.compile(r'featured_order\s*=\s*[{"]?\s*(\d+)')


def parse_bibtex_entries(bib_content):
    """Parse BibTeX content and return entries by category, plus featured entries.

    Featured entries are returned as (order, key, entry) tuples; `order` is the
    `featured_order` value, defaulting to a large number so unordered featured
    entries sort after explicitly ordered ones (ties keep file order).
    """
    books = []
    articles = []
    other = []
    featured = []

    # Find all entries
    pattern = r'@(\w+)\{([^,]+),\s*\n((?:[^@])*?)\n\}'
    matches = re.finditer(pattern, bib_content, re.DOTALL | re.MULTILINE)

    for match in matches:
        entry_type = match.group(1).lower()
        entry_key = match.group(2)
        entry_body = match.group(3)

        # Reconstruct the full entry
        entry = f"@{match.group(1)}{{{entry_key},\n{entry_body}\n}}\n\n"

        if entry_type in BOOKS:
            books.append((entry_key, entry))
        elif entry_type in ARTICLES:
            articles.append((entry_key, entry))
        else:
            other.append((entry_key, entry))

        if FEATURED_RE.search(entry_body):
            order_match = FEATURED_ORDER_RE.search(entry_body)
            order = int(order_match.group(1)) if order_match else 9999
            featured.append((order, entry_key, entry_type, entry_body))

    return books, articles, other, featured


def generate_html_for_category(entries, temp_bib_file):
    """Generate HTML for a category of entries."""
    if not entries:
        return ""

    # Write entries to temp file
    with open(temp_bib_file, 'w') as f:
        for _, entry in entries:
            f.write(entry)

    # Get all citation keys
    cite_keys = [key for key, _ in entries]

    # Create markdown with nocite
    nocite = '@' + ';@'.join(cite_keys)
    md_input = f"---\nnocite: '{nocite}'\n---\n"

    # Run pandoc
    result = subprocess.run(
        ['pandoc', '--citeproc',
         f'--bibliography={temp_bib_file}',
         f'--csl={CSL_FILE}',
         '-f', 'markdown',
         '-t', 'html'],
        input=md_input,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error running pandoc: {result.stderr}", file=sys.stderr)
        return ""

    # Clean up HTML - join broken lines in tags
    html = result.stdout
    # Remove newlines within HTML tags
    html = re.sub(r'\n([a-z-]+=)', r' \1', html)

    return html


# Which BibTeX field names the venue, per entry type. Everything else (misc,
# unpublished, ...) falls back to journal then publisher.
VENUE_FIELDS = {
    'article': 'journal',
    'inproceedings': 'booktitle',
    'incollection': 'booktitle',
    'inbook': 'booktitle',
    'book': 'publisher',
}


def extract_field(body, name):
    """Return the raw value of a BibTeX field, or None.

    Handles `{...}` (with nested braces), `"..."`, and bare values. The
    lookbehind keeps `title` from matching inside `booktitle`, etc.
    """
    m = re.search(r'(?<![\w])' + re.escape(name) + r'\s*=\s*', body, re.IGNORECASE)
    if not m:
        return None
    i = m.end()
    if i >= len(body):
        return None
    if body[i] == '{':
        depth = 0
        for j in range(i, len(body)):
            if body[j] == '{':
                depth += 1
            elif body[j] == '}':
                depth -= 1
                if depth == 0:
                    return body[i + 1:j]
        return None
    if body[i] == '"':
        j = body.find('"', i + 1)
        return body[i + 1:j] if j != -1 else None
    m2 = re.match(r'([^,\n]+)', body[i:])
    return m2.group(1) if m2 else None


def clean_value(val):
    """Normalize a BibTeX value for plain-text display."""
    if val is None:
        return None
    val = re.sub(r'\s+', ' ', val).strip()
    val = val.replace('{', '').replace('}', '')
    for esc, ch in (('\\&', '&'), ('\\%', '%'), ('\\$', '$'), ('\\#', '#')):
        val = val.replace(esc, ch)
    return val.replace('--', '–').strip()


def link_label(url):
    """Short tag shown next to an entry, matching the publications page."""
    if 'doi.org' in url:
        return '[doi]'
    if re.search(r'\.pdf($|\s)', url, re.IGNORECASE) or '/pdf' in url:
        return '[pdf]'
    return '[link]'


def build_featured_entries(featured):
    """Turn featured (order, key, type, body) tuples into display dicts,
    ordered by `featured_order`. The homepage template renders these as a
    compact, flush-left list — full Chicago detail lives on /references."""
    entries = []
    for _, key, entry_type, body in sorted(featured, key=lambda t: (t[0], t[1])):
        url = extract_field(body, 'url')
        url = url.strip() if url else None
        if not url:
            doi = extract_field(body, 'doi')
            if doi:
                url = 'https://doi.org/' + doi.strip()

        venue_field = VENUE_FIELDS.get(entry_type, 'journal')
        venue = clean_value(extract_field(body, venue_field)) \
            or clean_value(extract_field(body, 'publisher'))

        entries.append({
            'title': clean_value(extract_field(body, 'title')),
            'venue': venue,
            'year': clean_value(extract_field(body, 'year')),
            'url': url,
            'label': link_label(url) if url else None,
        })
    return entries


def main():
    # Read BibTeX file
    with open(BIB_FILE, 'r') as f:
        bib_content = f.read()

    # Parse entries by category
    books, articles, other, featured = parse_bibtex_entries(bib_content)

    print(f"Found: {len(books)} books, {len(articles)} articles, "
          f"{len(other)} other, {len(featured)} featured")

    # Generate HTML for each category
    temp_bib = Path("/tmp/references-temp.bib")

    books_html = generate_html_for_category(books, temp_bib)
    articles_html = generate_html_for_category(articles, temp_bib)
    other_html = generate_html_for_category(other, temp_bib)
    featured_entries = build_featured_entries(featured)

    # Clean up temp file
    temp_bib.unlink(missing_ok=True)

    # Write the featured fields for the homepage template (compact list).
    with open(FEATURED_OUTPUT, 'w') as f:
        json.dump({"entries": featured_entries, "count": len(featured_entries)},
                  f, indent=2, ensure_ascii=False)
    print(f"✓ Generated {FEATURED_OUTPUT} ({len(featured_entries)} featured)")

    # Get current date in Hugo format
    now = datetime.now()
    tz_offset = now.strftime('%z')
    if tz_offset:
        tz_formatted = f"{tz_offset[:-2]}:{tz_offset[-2:]}"
        current_date = now.strftime(f'%Y-%m-%dT%H:%M:%S') + tz_formatted
    else:
        current_date = now.strftime('%Y-%m-%dT%H:%M:%S+01:00')

    # Build final HTML with sections
    content_parts = ['<style>.csl-entry{text-indent: -1.5em; margin-left: 1.5em;}</style>']

    if books_html:
        content_parts.append('\n<h2>Books</h2>\n')
        content_parts.append(books_html)

    if articles_html:
        content_parts.append('\n<h2>Journal Articles</h2>\n')
        content_parts.append(articles_html)

    if other_html:
        content_parts.append('\n<h2>Conference Papers, Book Chapters, and Other Publications</h2>\n')
        content_parts.append(other_html)

    content = ''.join(content_parts)

    # Write output file
    output_content = f"""+++
title = "List of publications"
author = ["Folgert Karsdorp"]
date = 2022-11-20T00:00:00+01:00
layout = "pubs"
lastmod = {current_date}
draft = false
+++

{content}
"""

    with open(OUTPUT, 'w') as f:
        f.write(output_content)

    print(f"✓ Generated {OUTPUT} from {BIB_FILE}")


if __name__ == '__main__':
    main()
