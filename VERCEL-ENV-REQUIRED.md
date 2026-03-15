# משתני סביבה נדרשים ב-Vercel — Clubbing

## חובה (ללא אלה האתר לא יעבוד)

| משתנה | ערך | הערות |
|-------|-----|-------|
| `DATABASE_URL` | `postgresql://...` | חיבור ל-Postgres. אם יש לך `POSTGRES_URL` — העתק את הערך ל-`DATABASE_URL` |
| `AUTH_SECRET` | מפתח אקראי 32+ תווים | `openssl rand -base64 32` |
| `AUTH_URL` | `https://clubbing-two.vercel.app` | בלי רווחים, בלי `/` בסוף |
| `NEXTAUTH_URL` | `https://clubbing-two.vercel.app` | כמו AUTH_URL |
| `NEXT_PUBLIC_APP_URL` | `https://clubbing-two.vercel.app` | כתובת האתר לציבור |

## Google Login (התחברות עם Google)

האפליקציה תומכת בשני שמות — מספיק אחד מכל זוג:

| אפשרות 1 | אפשרות 2 | ערך |
|----------|----------|-----|
| `AUTH_GOOGLE_ID` | `GOOGLE_CLIENT_ID` | Client ID מ-Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | `GOOGLE_CLIENT_SECRET` | Client Secret מ-Google Cloud Console |

אם יש לך `GOOGLE_CLIENT_ID` — הוסף גם `GOOGLE_CLIENT_SECRET` (או `AUTH_GOOGLE_SECRET`).

## אופציונלי

| משתנה | שימוש |
|-------|--------|
| `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET` | התחברות עם Facebook |
| `AUTH_INSTAGRAM_ID`, `AUTH_INSTAGRAM_SECRET` | התחברות עם Instagram |
| `FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_IDS` | סנכרון אירועים מ-Facebook |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET` | CRM מנהלים (ברירת מחדל: admin/admin) |

## משתנים שלא בשימוש ב-Clubbing

אם יש לך משתנים כמו `ATLAS_URI`, `REDIS_URL`, `NEXT_PUBLIC_CLOUDINARY_*` — הם כנראה מפרויקט אחר. אפשר למחוק אם לא משתמשים בהם.

## בדיקה

אחרי עדכון: https://clubbing-two.vercel.app/api/oauth-status  
אם `ready: true` ו־`google: true` — הכל מוגדר.
