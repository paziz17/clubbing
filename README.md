# Clubbing — Join the Party

אפליקציה לגילוי אירועים, מסיבות ומועדונים בהתאם לטעם האישי. גרסה 1.0

## הרצה

```bash
npm install
npm run db:seed   # יצירת אירועי דמו
npm run dev       # http://localhost:3000
```

## התחברות אמיתית (OAuth)

כדי להפעיל התחברות עם Facebook, Google או Instagram, הוסף ל-`.env`:

```
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_INSTAGRAM_ID=...
AUTH_INSTAGRAM_SECRET=...
```

- **Facebook:** [developers.facebook.com](https://developers.facebook.com/apps/) → אפליקציה → Facebook Login → הוסף `https://YOUR_DOMAIN/api/auth/callback/facebook`
- **Google:** [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 → הוסף redirect URI
- **Instagram:** דורש אפליקציית Meta (אותו תהליך כמו Facebook)

## זרימה

1. **Splash** — לוגו CLUBBING, 2 שניות, מעבר אוטומטי
2. **התחברות** — Facebook / Instagram / Google / כניסה כאורח
3. **בחירת תחומי עניין** — מוזיקה, סוג אירוע, גיל, אזור (כפתורים עגולים)
4. **תוצאות** — רשימת אירועים מותאמת
5. **עמוד אירוע** — פרטים, רכישת כרטיסים, ניווט, שיתוף
6. **Be The Party** — יצירת אירוע (משתמשים רשומים)
7. **פרופיל** — מועדפים, אירועים שיצרתי

## מיון לפי מרחק

האירועים ממוינים תמיד **מהכי קרוב להכי רחוק** — לפי האזור שנבחר (תל אביב, חיפה וכו') או ברירת מחדל תל אביב.

## סנכרון Facebook

כדי להביא אירועים מדפי Facebook:

1. צור אפליקציה ב-[Facebook Developers](https://developers.facebook.com/)
2. קבל Page Access Token מ-Graph API Explorer
3. הוסף ל-`.env`:
```
FACEBOOK_ACCESS_TOKEN=your_token
FACEBOOK_PAGE_IDS=123456789,987654321
```
4. לחיצה על "רענן נתונים" תסנכרן גם מ-Facebook

**Instagram:** אין API ציבורי לאירועים — לא נתמך.

## טכנולוגיות

- Next.js 16, TypeScript, Tailwind
- Prisma + SQLite
- פונט Montserrat
