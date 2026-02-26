#!/usr/bin/env python3
"""
Generate publications page from BibTeX file, organized by type.
"""

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

# Entry type mappings
BOOKS = {'book'}  # Only standalone books
ARTICLES = {'article'}  # Journal articles
# Everything else goes to "other": inproceedings, incollection, inbook, misc, unpublished, etc.


def parse_bibtex_entries(bib_content):
    """Parse BibTeX content and return entries by category."""
    books = []
    articles = []
    other = []

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

    return books, articles, other


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


def main():
    # Read BibTeX file
    with open(BIB_FILE, 'r') as f:
        bib_content = f.read()

    # Parse entries by category
    books, articles, other = parse_bibtex_entries(bib_content)

    print(f"Found: {len(books)} books, {len(articles)} articles, {len(other)} other")

    # Generate HTML for each category
    temp_bib = Path("/tmp/references-temp.bib")

    books_html = generate_html_for_category(books, temp_bib)
    articles_html = generate_html_for_category(articles, temp_bib)
    other_html = generate_html_for_category(other, temp_bib)

    # Clean up temp file
    temp_bib.unlink(missing_ok=True)

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
