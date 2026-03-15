# 🔧 תיקון התחברות Google — צעד אחר צעד

## אם oauth-status מראה ready: false

| שדה | משמעות |
|-----|--------|
| google: false | AUTH_GOOGLE_ID ו-AUTH_GOOGLE_SECRET חסרים |
| nextAuthUrl: false | NEXTAUTH_URL חסר |
| authUrlCorrect: false | AUTH_URL שגוי (חייב להיות https://clubbing-two.vercel.app) |

**חשוב:** בעת הוספת משתנים ב-Vercel — אל תוסיף רווחים או שורות חדשות בסוף הערך!

---

## שלב 1: Google Cloud Console (חובה!)

**שגיאת redirect_uri_mismatch?** — חייבים להוסיף את שני ה-URIs הבאים!

1. היכנס ל־https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. לחץ על ה־**OAuth 2.0 Client ID** שלך
4. ב־**Authorized redirect URIs** — הוסף **שניהם** (מקומי + Vercel):
   ```
   https://clubbing-two.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
5. **Save** — שינוי נכנס מיד, אין צורך ב-Redeploy

---

## שלב 2: Vercel — משתני סביבה

1. https://vercel.com → **בחר את הפרויקט** (זה שמגיש clubbing-two.vercel.app)
2. **Settings** → **Environment Variables**
3. ודא שאתה ב־**Project** (לא Team)
4. הוסף/עדכן:

| Key | Value |
|-----|-------|
| AUTH_URL | https://clubbing-two.vercel.app (בדיוק! בלי רווחים) |
| NEXTAUTH_URL | https://clubbing-two.vercel.app |
| NEXT_PUBLIC_APP_URL | https://clubbing-two.vercel.app |
| AUTH_GOOGLE_ID | (המפתח מ-Google) |
| AUTH_GOOGLE_SECRET | (הסיסמה מ-Google) |
| AUTH_SECRET | (מפתח אקראי 32+ תווים) |

5. **Redeploy** — Deployments → ⋮ → Redeploy

---

## שלב 3: מקומי — קובץ .env

בתיקיית `clubbing` צור/עדכן `.env`:

```
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=(אותו מפתח מ-Google)
AUTH_GOOGLE_SECRET=(אותה סיסמה מ-Google)
AUTH_SECRET=(אותו AUTH_SECRET)
```

---

## בדיקה

**מקומי:** http://localhost:3000/api/oauth-status  
**Vercel:** https://clubbing-two.vercel.app/api/oauth-status  

בדוק את השדה `redirectUri` — הוא חייב להיות **זהה בדיוק** לאחד מ־Authorized redirect URIs ב־Google:
- מקומי: `http://localhost:3000/api/auth/callback/google`
- Vercel: `https://clubbing-two.vercel.app/api/auth/callback/google`

אם `ready: true` ו־`google: true` — הכל מוגדר.

---

## אם עדיין לא עובד

- ודא ש־Redeploy בוצע אחרי הוספת משתנים
- נקה cache בדפדפן (Ctrl+Shift+R)
- נסה בחלון פרטי
