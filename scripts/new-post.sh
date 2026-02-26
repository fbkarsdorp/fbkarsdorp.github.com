#!/bin/bash
# Create a new blog post with proper timestamp naming

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Get timestamp and slug from arguments
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
SLUG="$1"

if [ -z "$SLUG" ]; then
    echo "Usage: ./scripts/new-post.sh <slug>"
    echo "Example: ./scripts/new-post.sh my_new_post"
    exit 1
fi

# Create filename
FILENAME="${TIMESTAMP}-${SLUG}.md"
FILEPATH="$PROJECT_DIR/content/posts/$FILENAME"

# Get current date in Hugo format
HUGO_DATE=$(date +"%Y-%m-%dT%H:%M:%S%z" | sed 's/\([0-9][0-9]\)$/:\1/')

# Create the post file
cat > "$FILEPATH" <<EOF
+++
title = "Your Title Here"
author = ["Folgert Karsdorp"]
date = $HUGO_DATE
lastmod = $HUGO_DATE
tags = []
draft = true
+++

Your content here.
EOF

echo "✓ Created new post: $FILEPATH"
echo ""
echo "Next steps:"
echo "1. Open the file and edit the title and content"
echo "2. Add relevant tags"
echo "3. Set draft = false when ready to publish"
echo "4. Run 'hugo server -D' to preview"
