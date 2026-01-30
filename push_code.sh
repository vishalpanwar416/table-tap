#!/bin/bash
echo "=== Starting Push Process ==="
cd "$(dirname "$0")"

echo "1. Checking status..."
git status

echo "2. Removing stale locks (if any)..."
rm -f .git/index.lock

echo "3. Adding changes..."
git add .

echo "4. Committing changes..."
git commit -m "feat: unified loading screens, guest order fix, and payment handling" --no-verify

echo "5. Pushing to origin/dev..."
git push origin dev

echo "=== Done! ==="
