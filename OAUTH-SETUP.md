# חיבור Facebook, Google ו-Instagram — מדריך מלא

הקוד כבר מוכן. כל מה שצריך הוא ליצור אפליקציות בפלטפורמות ולקבל מפתחות.

---

## סיכום מהיר

| פלטפורמה | קישור ליצירת אפליקציה | משתני סביבה |
|----------|------------------------|-------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com/) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| **Facebook** | [Meta for Developers](https://developers.facebook.com/) | `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET` |
| **Instagram** | דרך Meta (אותו אקאונט) | `AUTH_INSTAGRAM_ID`, `AUTH_INSTAGRAM_SECRET` |

**כתובת Callback (לכל הפלטפורמות):**
```
https://clubbing-two.vercel.app/api/auth/callback/[provider]
```
כאשר `[provider]` = `google`, `facebook` או `instagram`.

---

## 1. Google

### שלבים

1. היכנס ל־[Google Cloud Console](https://console.cloud.google.com/)
2. צור פרויקט חדש או בחר קיים
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. בחר **Web application**
5. **Authorized redirect URIs** — הוסף **שניהם** (למקומי ולפרודקשן):
   ```
   https://clubbing-two.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
6. העתק **Client ID** ו־**Client Secret**

### משתני סביבה

```
AUTH_GOOGLE_ID=xxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxx
```

---

## 2. Facebook

### שלבים

1. היכנס ל־[Meta for Developers](https://developers.facebook.com/)
2. **My Apps** → **Create App** → **Consumer** (או **Business**)
3. הוסף **Facebook Login** → **Web**
4. **Facebook Login** → **Settings**:
   - **Valid OAuth Redirect URIs:**
     ```
     https://clubbing-two.vercel.app/api/auth/callback/facebook
     ```
   - (למקומי: `http://localhost:3000/api/auth/callback/facebook`)
5. **App Mode** — עבור ל־**Live** (אחרי בדיקות)
6. **Settings** → **Basic** — העתק **App ID** ו־**App Secret**

### משתני סביבה

```
AUTH_FACEBOOK_ID=xxxxx
AUTH_FACEBOOK_SECRET=xxxxx
```

---

## 3. Instagram

**הערה חשובה:** Meta הפסיקה את Instagram Basic Display API (דצמבר 2024). NextAuth משתמש ב־Basic Display, ולכן **חיבור Instagram עשוי לא לעבוד** לאפליקציות חדשות.

### אם בכל זאת רוצים לנסות

1. ב־[Meta for Developers](https://developers.facebook.com/) — **Add Product** → **Instagram Basic Display**
2. הגדר **Valid OAuth Redirect URIs:**
   ```
   https://clubbing-two.vercel.app/api/auth/callback/instagram
   ```
3. העתק **Instagram App ID** ו־**Instagram App Secret**

### משתני סביבה

```
AUTH_INSTAGRAM_ID=xxxxx
AUTH_INSTAGRAM_SECRET=xxxxx
```

### חלופה

אם Instagram לא עובד — משתמשים יכולים להתחבר עם **Facebook** (אותו אקאונט Meta). רוב המשתמשים שמחוברים ל־Instagram מחוברים גם ל־Facebook.

---

## 4. הוספת המשתנים

### Vercel (פרודקשן — https://clubbing-two.vercel.app)

1. [Vercel Dashboard](https://vercel.com) → הפרויקט **clubbing**
2. **Settings** → **Environment Variables**
3. הוסף את המשתנים הבאים (Production, Preview, Development):

| משתנה | ערך |
|-------|-----|
| `AUTH_URL` | `https://clubbing-two.vercel.app` |
| `NEXTAUTH_URL` | `https://clubbing-two.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://clubbing-two.vercel.app` |
| `AUTH_GOOGLE_ID` | המפתח מ־Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | הסיסמה מ־Google Cloud Console |
| `AUTH_SECRET` | מפתח אקראי (למשל: `openssl rand -base64 32`) |

4. **Redeploy** את האתר (Deployments → ⋮ → Redeploy)

### מקומי (`.env`)

הוסף לקובץ `.env`:

```
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
# AUTH_FACEBOOK_ID=...
# AUTH_FACEBOOK_SECRET=...
```

---

## 5. בדיקה

1. הרץ `npm run dev` (מקומי) או ודא שה־deploy ב־Vercel מעודכן
2. גלוש ל־https://clubbing-two.vercel.app/auth
3. לחץ על כפתור ההתחברות (Google / Facebook / Instagram)
4. אם הכל מוגדר נכון — תועבר לפלטפורמה ותחזור מחובר

---

## טבלת סיכום — מה אתה עושה vs מה הקוד עושה

| פעולה | אתה | הקוד (כבר מוכן) |
|-------|-----|------------------|
| יצירת אפליקציה ב־Google | ✅ | — |
| יצירת אפליקציה ב־Meta (FB/IG) | ✅ | — |
| הגדרת Redirect URIs | ✅ | — |
| העתקת מפתחות ל־.env / Vercel | ✅ | — |
| NextAuth + Prisma | — | ✅ |
| כפתורי התחברות בעמוד /auth | — | ✅ |
| שמירת משתמשים ב־DB | — | ✅ |
