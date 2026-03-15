# ✅ רשימת משתנים ל-Vercel — חובה ל-Google Login

אם ההתחברות עם Google לא עובדת, ודא שכל המשתנים הבאים מוגדרים **בפרויקט** (לא רק ב-Team).

## איפה להוסיף

1. [Vercel Dashboard](https://vercel.com) → **בחר את הפרויקט** (זה שמגיש את clubbing-two.vercel.app)
2. **Settings** → **Environment Variables**
3. ודא שאתה ב-**Project** (לא Team)

## משתנים חובה

| משתנה | ערך | הערות |
|-------|-----|-------|
| `AUTH_URL` | `https://clubbing-two.vercel.app` | |
| `NEXTAUTH_URL` | `https://clubbing-two.vercel.app` | |
| `NEXT_PUBLIC_APP_URL` | `https://clubbing-two.vercel.app` | |
| `AUTH_GOOGLE_ID` | Client ID מ-Google Cloud Console | |
| `AUTH_GOOGLE_SECRET` | Client Secret מ-Google Cloud Console | |
| `AUTH_SECRET` | מפתח אקראי (32+ תווים) | `openssl rand -base64 32` |

## אחרי הוספה

1. **Redeploy** — Deployments → ⋮ → Redeploy
2. חכה לסיום ה-deploy
3. נסה שוב: https://clubbing-two.vercel.app/auth

## Google Cloud Console — חובה!

ב־[Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth client → **Authorized redirect URIs** — הוסף **שניהם**:

```
https://clubbing-two.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

בלי זה תקבל `Error 400: redirect_uri_mismatch`.

---

## בדיקה

אם `/api/auth/providers` מחזיר `{}` — המשתנים לא נטענו. ודא:
- המשתנים בפרויקט הנכון
- Redeploy בוצע אחרי הוספת המשתנים
- אין Deployment Protection שחוסם את ה-API
