# 🌙 CLUBBING — v1.3

**מערכת הפעלה לחיי לילה — לוקאלית בלבד.**
מערכת CRM למועדונים (Web) + אפליקציית בליין (Android), בקוד אחד.

מבוסס על המדריך `clubbing-master-guidev 1.2 + v1.3.pdf`. ללא ענן, ללא Vercel, ללא Docker, ללא Postgres חיצוני.

---

## 🚀 התחלה — שלושה צעדים

```bash
cd clubbing
npm install
npm run setup     # יוצר .env, מאתחל SQLite, זורע נתוני דמו
npm run dev       # http://localhost:3000
```

זהו. הכל רץ מקובץ `prisma/dev.db` מקומי. אין צורך באף שירות חיצוני.

### גישה לאחר ההפעלה

- **אפליקציית בליין:** http://localhost:3000
- **כניסה למועדון (CRM):** http://localhost:3000/venue/login
  - משתמש: `goldroom`
  - סיסמה: `demo1234`
  - (יש גם `blockclub` עם אותה סיסמה)

---

## 📦 פקודות שימושיות

| פקודה | תיאור |
| --- | --- |
| `npm run dev` | הפעלת שרת הפיתוח |
| `npm run build` | בילד פרודקשן מקומי |
| `npm run start` | הרצת בילד הפרודקשן |
| `npm run db:studio` | UI לדפדוף ועריכת ה-DB (Prisma Studio) |
| `npm run db:reset` | מחיקה + זריעה מחדש של ה-DB |
| `npm run db:seed` | זריעת נתוני דמו בלבד |
| `npm run typecheck` | בדיקת TypeScript |
| `npm run android:add` | הוספת פלטפורמת Android (פעם אחת) |
| `npm run android:sync` | סנכרון Web → APK |
| `npm run android:open` | פתיחה ב-Android Studio |
| `npm run android:build` | בניית APK רלוונטי |

---

## 🏗️ מה נבנה (מלא לפי המדריך)

### צד הבליין (PWA + Android)
- **Splash + Auth:** Google · Facebook · Apple · Email · Guest
- **גילוי:** Wizard עם 4 שלבים — ז'אנר · סוג ערב · גיל · אזור
- **תוצאות:** רשימת אירועים מסוננת
- **דף אירוע:** מידע, אמן, באנר Club-it, פעולות מונית (Gett/Yango)
- **רכישה:** סוג כרטיס, כמות, אישור גיל, אמצעי תשלום (Grow / Club-it / Demo)
- **כרטיס דיגיטלי:** QR + Wallet/Email shortcut
- **Club-it:** הצטרפות, כרטיס וירטואלי, ארנק לפי מועדון, היסטוריה
- **Bump (אני כאן):** Check-in גאוגרפי + צבירת קרדיט
- **שוברים:** הנפקה ופדיון עם QR
- **מטבח:** הזמנה לאיסוף עם קוד pickup
- **אמנים:** דפי פרופיל + מעקב

### צד ה-CRM (Web)
- **דשבורד:** KPIs, גרף הכנסות יומי, אירועים קרובים
- **אירועים:** רשימה + יצירה + עריכה
- **הזמנות:** ניהול וסינון
- **לקוחות:** התפלגות דרגות, סטטיסטיקת הוצאה
- **תנועות:** Ledger מאוחד
- **הגדרות Club-it:** שיעורי קרדיט, ספי דרגות
- **Live:** ניטור אירועים בזמן אמת
- **Club Bot:** קמפיינים ב-WhatsApp
- **ביקורות / Selection / אמנים / מטבח:** כולל זרימה מלאה

---

## 🔌 אינטגרציות (הכל אופציונלי — Demo mode כברירת מחדל)

המערכת **רצה מלא ללא מפתחות**. הוסף מפתחות ב-`.env` כדי לעבור ממצב Demo למצב חי.

| שירות | משתנה סביבה | התנהגות ללא מפתח |
| --- | --- | --- |
| Grow / Meshulam (סליקה) | `GROW_PAGE_CODE` + `GROW_USER_ID` | מצב Demo — מאשר רכישה אוטומטית |
| Club-it (כרטיס נאמנות) | — | מנפיק כרטיס וירטואלי מקומי |
| WhatsApp Business | `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_ID` | מחזיר קישורי `wa.me` ידניים |
| Resend (אימייל) | `RESEND_API_KEY` | מדפיס למסוף הפיתוח |
| Google OAuth | `GOOGLE_CLIENT_ID/SECRET` | משתמש בכניסת אורח/אימייל |
| Facebook OAuth | `FACEBOOK_CLIENT_ID/SECRET` | משתמש בכניסת אורח/אימייל |
| Apple OAuth | `APPLE_CLIENT_ID/SECRET` | משתמש בכניסת אורח/אימייל |

---

## 📱 בניית APK ל-Android

האפליקציה היא PWA שעטופה ב-Capacitor. בפיתוח, ה-APK מצביע על שרת ה-Next.js שלך ב-LAN.

```bash
# 1. הוסף את פלטפורמת Android (פעם אחת)
npm run android:add

# 2. מצא את ה-IP המקומי שלך
ipconfig getifaddr en0          # macOS
# או
ip addr | grep "inet "          # Linux

# 3. הרץ את השרת על כל הממשקים
HOSTNAME=0.0.0.0 npm run dev

# 4. בנה ופתח Android Studio (התקן Wi-Fi באותה רשת)
CAP_SERVER_URL=http://192.168.x.x:3000 npm run android:sync
npm run android:open
```

> דרישות מקדימות ל-Android: [Android Studio](https://developer.android.com/studio) + Java JDK 17+.
> ניתן גם לפתוח את `http://localhost:3000` ישירות מהטלפון (PWA — "הוסף למסך הבית").

---

## 🗂️ מבנה הפרויקט

```
clubbing/
├─ prisma/
│  ├─ schema.prisma          # סכימת DB (SQLite)
│  ├─ seed.ts                # נתוני דמו
│  └─ dev.db                 # ה-DB עצמו (נוצר אוטומטית)
├─ scripts/
│  └─ setup.ts               # אתחול בקליק אחד
├─ src/
│  ├─ app/                   # Next.js App Router
│  │  ├─ (mobile)/           # מסכי הבליין
│  │  ├─ venue/(crm)/        # מסכי ה-CRM
│  │  └─ api/                # endpoints
│  ├─ components/            # רכיבי UI
│  └─ lib/                   # לוגיקה: tier, credits, checkout, qr...
├─ public/                   # PWA assets
├─ docs/OPERATOR-GUIDE.md    # מדריך הפעלה למפעיל
├─ capacitor.config.ts       # תצורת Android
└─ .env                      # מפתחות (נוצר ע"י setup)
```

---

## 🧪 מצב Demo — מה רץ ללא מפתחות

- ✅ DB מלא עם נתוני דמו
- ✅ כניסה כאורח / כניסת CRM
- ✅ כל זרימות הבליין (גילוי → רכישה → כרטיס → Club-it → Bump → מטבח)
- ✅ כל זרימות ה-CRM (דשבורד → אירועים → הזמנות → קמפיינים → ביקורות)
- ✅ הנפקת כרטיס Club-it (דמה — last4 רנדומלי)
- ✅ הנפקת שוברים עם QR
- ✅ קמפיינים שמחזירים קישורי wa.me
- ❌ סליקת אשראי אמיתית — תאשר אוטומטית במצב Demo
- ❌ שליחת WhatsApp/אימייל בפועל — תודפס למסוף

הוסף מפתחות אמיתיים ב-`.env` והכל יעבוד "live" באותו הקוד.

---

## 🌐 פריסה (Self-hosting מקומי)

המערכת תוכננה לרוץ על מחשב/שרת מקומי בלבד. דרכים נפוצות:

### א. הפעלה מקומית (פיתוח)
```bash
npm run dev
```

### ב. הפעלה כשירות פרודקשן מקומי
```bash
npm run build
npm run start    # מקשיב על :3000
```

תוכל לעטוף עם `pm2` או `systemd` להפעלה רציפה:

```bash
npx pm2 start "npm run start" --name clubbing
npx pm2 save
npx pm2 startup
```

### ג. גישה מהרשת המקומית
הפעל את Next על `0.0.0.0` ותרשה חיבורים:
```bash
HOSTNAME=0.0.0.0 PORT=3000 npm run start
```
ואז גש מ-`http://<LAN-IP>:3000` מכל מכשיר באותו Wi-Fi.

---

## 📄 קבצים חשובים נוספים

- [`docs/OPERATOR-GUIDE.md`](./docs/OPERATOR-GUIDE.md) — מדריך הפעלה ותחזוקה למפעיל בעברית
- `prisma/schema.prisma` — סכימת ה-DB (23 מודלים)
- `src/lib/enums.ts` — טיפוסי TypeScript לכל "ה-enums" (מאוחסנים כ-strings ב-SQLite)
- `src/lib/credits.ts` — לוגיקת צבירה ופדיון של קרדיט
- `src/lib/checkout.ts` — תזמור רכישה מלא

---

## 🛡️ אבטחה מקומית

- סיסמאות CRM: `bcrypt` (10 rounds)
- Session ה-CRM: JWT נפרד (`VENUE_SESSION_SECRET`)
- Session הבליין: NextAuth עם JWT (`NEXTAUTH_SECRET`)
- ב-`npm run setup` נוצרים אוטומטית סודות אקראיים חזקים

⚠️ **בכל עת לפני פריסה לשרת נגיש מהאינטרנט:** החלף את הסודות, הפעל HTTPS (Nginx + certbot למשל), הגדר חומת אש שמאפשרת רק 443.
