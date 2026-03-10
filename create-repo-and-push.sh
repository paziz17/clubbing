#!/bin/bash
# יצירת ריפו ב-GitHub והעלאה
# דורש: GitHub Personal Access Token עם הרשאת repo

set -e
cd "$(dirname "$0")"

REPO_NAME="clubbing"
GITHUB_USER="paziz17"

echo "=== יצירת ריפו ב-GitHub ==="
echo ""
echo "אפשרות 1 — ידנית (מומלץ):"
echo "  1. פתח: https://github.com/new?name=${REPO_NAME}"
echo "  2. לחץ Create repository (אל תסמן README)"
echo "  3. הרץ: git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git && git push -u origin main"
echo ""
echo "אפשרות 2 — עם Token (אוטומטי):"
if [ -z "$GITHUB_TOKEN" ]; then
  echo "  הגדר GITHUB_TOKEN ואז הרץ:"
  echo "  export GITHUB_TOKEN=your_token"
  echo "  $0"
  exit 0
fi

echo "יוצר ריפו..."
curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/user/repos" -d "{\"name\":\"${REPO_NAME}\",\"private\":false}" > /dev/null

echo "מוסיף remote ומעלה..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
git push -u origin main

echo ""
echo "✅ הועלה בהצלחה ל-https://github.com/${GITHUB_USER}/${REPO_NAME}"
