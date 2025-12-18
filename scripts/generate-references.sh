#!/bin/bash
# Script to generate the publications page from BibTeX file
# This replaces the org-mode export workflow

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Call the Python script that does the actual work
python3 "$SCRIPT_DIR/generate-references.py"
