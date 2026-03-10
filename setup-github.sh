#!/bin/bash
# חיבור ל-GitHub ופריסה ל-Vercel
# הרץ אחרי שיצרת ריפו ב-GitHub: https://github.com/new

set -e
cd "$(dirname "$0")"

echo "=== חיבור ל-GitHub ==="
echo ""
echo "1. צור ריפו חדש: https://github.com/new"
echo "   שם: clubbing (או כל שם)"
echo "   אל תסמן 'Add README'"
echo ""
read -p "2. הכנס את שם המשתמש ב-GitHub: " GITHUB_USER
read -p "3. הכנס את שם הריפו (ברירת מחדל: clubbing): " REPO_NAME
REPO_NAME=${REPO_NAME:-clubbing}

echo ""
echo "מוסיף remote ומעלה..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
git push -u origin main

echo ""
echo "✅ הועלה ל-GitHub!"
echo ""
echo "=== פריסה ל-Vercel ==="
echo "1. היכנס ל-https://vercel.com"
echo "2. Import Git Repository → בחר ${REPO_NAME}"
echo "3. הוסף Environment Variables (ראה DEPLOY.md)"
echo "4. Deploy!"
