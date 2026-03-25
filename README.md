# Clubing — Join the Party

אפליקציה לגילוי אירועים, מסיבות ומועדונים בהתאם לטעם האישי. גרסה 1.0

## מונוריפו (שני פרויקטים באותו מאגר)

| תיקייה | תיאור |
|--------|--------|
| **שורש המאגר** (`./`) | אפליקציית **Clubing** (Next.js) — גילוי אירועים, CRM, התחברות |
| **`nightlife-loyalty/`** | אפליקציית **NightLife Loyalty** — נאמנות מועדונים, Pass, ארנק, דשבורד (Next.js נפרד) |

**הרצה מקומית של Loyalty:**

```bash
cd nightlife-loyalty
cp .env.example .env   # והתאם DATABASE_URL / JWT_SECRET
npm install
npx prisma db push
npm run db:seed
npm run dev              # פורט 3000 — עצור את Clubing אם רץ על אותו פורט
```

**Vercel:** לפרויקט שני צור Deployment נפרד ובחר **Root Directory** = `nightlife-loyalty`, עם `DATABASE_URL` ו־`JWT_SECRET` (בייצור מומלץ Postgres במקום SQLite).

## הרצה

```bash
npm install
npm run db:seed   # יצירת אירועי דמו
npm run dev       # http://localhost:3000
```

## אפליקציות נייטיב (iPhone ו־Android) — Capacitor

במאגר קיימות תיקיות **`ios/`** ו־**`android/`**: מעטפת **אפליקציה אמיתית** שטוענת את אותו אתר מהשרת (ברירת מחדל: `https://clubbing-two.vercel.app`).  
אין שכפול לוגיקה — זה WebView מלא מסך מול ה-Next.js ב-Vercel; אפשר לפרסם ב-**App Store** ו-**Google Play** אחרי חתימה והגשה.

**דרישות:** macOS עם **Xcode** (לאייפון), **Android Studio** + JDK (לאנדרואיד).

```bash
npm install
npm run mobile:sync          # מעתיק את www + מגדיר את capacitor.config
npm run mobile:open:ios      # פותח Xcode — בחר מכשיר/Simulator ולחץ Run
npm run mobile:open:android  # פותח Android Studio — Gradle Sync ואז Run
```

**פיתוח מול שרת מקומי** (אותה רשת Wi‑Fi כמו הטלפון):

```bash
# בטרמינל אחר: npm run dev
export CAP_SERVER_URL="http://YOUR_LAN_IP:3000"
export CAP_ALLOW_CLEARTEXT="true"   # HTTP מקומי בלי SSL
npm run mobile:sync
```

עריכת כתובת השרת הקבועה: קובץ `capacitor.config.ts` (משתנה `CAP_SERVER_URL` או ברירת מחדל בקוד).

## אפליקציית ווב על המסך הבית (PWA) — ללא חנות

האתר מוגדר גם כ־**PWA**: התקנה מהדפדפן בלי App Store / Play.

| פלטפורמה | איך |
|----------|-----|
| **Android (Chrome)** | תפריט ⋮ → **התקן אפליקציה** / **Add to Home screen**. |
| **iPhone (Safari)** | שיתוף ↑ → **הוסף למסך הבית**. |

קובץ `public/sw.js` + `PwaRegister`; אייקונים ב־`public/icons/`.

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

## CRM — ניהול מועדונים והזמנות

| כניסה | כתובת | תיאור |
|--------|--------|--------|
| **מנהל מערכת** | `/admin/login` | רואה את כל המועדונים, האירועים וההזמנות. אחרי התחברות: `/admin` |
| **מועדון בודד** | `/venue/login` | רואה רק אירועים של המקום. אחרי התחברות: `/venue` |

- **דמו מועדון:** למשל `goldroom` / `club123` או `basementjaffa` / `club123` (מוגדרים ב־`src/lib/venue-auth.ts` וב־seed).
- **דמו אדמין:** ברירת מחדל `admin` / `admin` — בייצור חובה להגדיר `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET` ב־Vercel.
- מסך **תוצאות** (`/results`) כולל בתחתית קישורים לשתי הכניסות.

## זרימה

1. **Splash** — לוגו CLUBING (מותג), 5 שניות, מעבר אוטומטי
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

## פריסה ל־Vercel + GitHub

1. צור מאגר ב־GitHub ודחוף את התיקייה `clubbing` (שורש הפרויקט):
   ```bash
   cd clubbing
   git init
   git add .
   git commit -m "Initial commit: Clubing app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   git push -u origin main
   ```
2. ב־[Vercel](https://vercel.com) — **Add New Project** → ייבא את המאגר. שורש הבילד: אותה תיקייה (אם המאגר הוא רק `clubbing`, אין צורך בשינוי).
3. **Environment Variables** — העתק מ־`.env.example` לפחות:
   - `DATABASE_URL` — Postgres (למשל Neon דרך Vercel Storage)
   - `AUTH_SECRET`, `AUTH_URL` / `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (חובה בפרודקשן)
4. אחרי הדיפלוי הראשון הרץ מיגרציות מקומית מול אותו `DATABASE_URL` או השתמש ב־Vercel build: בפרויקט מוגדר `build:vercel` (`prisma migrate deploy` + `next build`) דרך `vercel.json`.

## טכנולוגיות

- Next.js 16, TypeScript, Tailwind
- Prisma + PostgreSQL
- פונט Montserrat
