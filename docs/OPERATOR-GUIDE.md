# 📘 CLUBBING — מדריך הפעלה למפעיל

מערכת לוקאלית, ללא ענן. נועדה לרוץ על המחשב/שרת שלך.

---

## 1. הקמה ראשונית (פעם אחת)

### דרישות מקדימות
- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **npm 10+**
- (לבניית Android בלבד) **Android Studio** + **Java JDK 17+**

### הפעלה
```bash
cd clubbing
npm install
npm run setup
npm run dev
```

הסקריפט `setup` עושה את כל הבאים אוטומטית:
1. יוצר קובץ `.env` עם סודות חזקים אקראיים
2. מייצר את לקוח ה-Prisma
3. יוצר את ה-DB ב-`prisma/dev.db`
4. זורע נתוני דמו (2 מועדונים, 1 אמן, 2 אירועים, תפריט מטבח)

> כל המידע נשמר בקובץ אחד: `prisma/dev.db`. אם מחקת אותו — `npm run setup` ייצור אותו מחדש.

---

## 2. כניסה ראשונה

### CRM (אדמין מועדון)
- **URL:** http://localhost:3000/venue/login
- משתמש: `goldroom` · סיסמה: `demo1234`
- משתמש: `blockclub` · סיסמה: `demo1234`

### אפליקציית בליין
- **URL:** http://localhost:3000
- ניתן להיכנס כאורח, באימייל, או דרך OAuth (אם הוגדרו מפתחות)

---

## 3. ניהול ה-DB

### גלישה ועריכה גרפית
```bash
npm run db:studio
```
פותח את Prisma Studio ב-http://localhost:5555 — UI מלא לכל הטבלאות.

### איפוס מלא + זריעה חדשה
```bash
npm run db:reset
```

### יצירת מועדון חדש
פתח את Prisma Studio (`npm run db:studio`), לחץ על טבלת `Venue` → **Add record**, ומלא:
- `slug`, `name`, `username`, `address`, `city`
- `passwordHash`: יש לייצר עם הסקריפט הבא:

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "your-password-here"
```

---

## 4. שינוי הגדרות של מועדון מתוך ה-CRM

מסך **הגדרות** ב-CRM (`/venue/settings`) שולט ב:
- שיעור הקרדיט לכל דרגה
- ספי קידום דרגות (Silver / Gold / Platinum)
- מינימום פדיון
- תוקף קרדיט בימים

---

## 5. הוספת אינטגרציות אמיתיות

ערוך את `.env` והוסף את המפתחות הרלוונטיים. הפעל מחדש (`npm run dev`).

### Stripe (סליקה)
```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
ב-Stripe Dashboard, הוסף webhook ל-`http://<your-domain>/api/stripe/webhook` (אם תחשוף לרשת).

### Stripe Issuing (כרטיסי Club-it אמיתיים)
```env
STRIPE_ISSUING_ENABLED=1
```
דורש אישור חשבון Stripe Issuing.

### WhatsApp Business Cloud API
1. הקם אפליקציה ב-[Meta for Developers](https://developers.facebook.com)
2. הוסף את המוצר "WhatsApp"
3. העתק את `Phone Number ID` ואת `Permanent Access Token`:
```env
WHATSAPP_PHONE_ID="123456789"
WHATSAPP_ACCESS_TOKEN="EAAB..."
```

ללא מפתחות — קמפיינים ישלחו קישורי `wa.me` שהמפעיל יכול לפתוח ידנית.

### Resend (אימייל)
1. צור חשבון ב-[resend.com](https://resend.com)
2. אמת דומיין
3. הוסף:
```env
RESEND_API_KEY="re_..."
EMAIL_FROM="CLUBBING <noreply@yourdomain.com>"
```

### OAuth Providers (Google / Facebook / Apple)
לכל ספק:
1. צור OAuth Client ב-Console של הספק
2. הוסף ל-`.env`:
```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```
3. הוסף `http://localhost:3000/api/auth/callback/google` כ-Redirect URI

---

## 6. תפעול שוטף

### Backup של ה-DB
SQLite זה קובץ — פשוט העתק אותו:
```bash
cp prisma/dev.db backups/clubbing-$(date +%Y%m%d-%H%M).db
```

מומלץ לתזמן ב-`crontab -e`:
```cron
0 3 * * * cp /path/to/clubbing/prisma/dev.db /path/to/backups/clubbing-$(date +\%Y\%m\%d).db
```

### Restore מ-backup
```bash
npm run build  # שלא יהיה דאון-טיים אם רץ
cp backups/clubbing-20260514-0300.db prisma/dev.db
```

### עדכון קוד
```bash
git pull
npm install
npx prisma db push    # אם יש שינויי סכימה
npm run build
```

### ניטור לוגים
ה-Next.js כותב ל-stdout. אם רץ עם pm2:
```bash
npx pm2 logs clubbing
```

---

## 7. בניית האפליקציה (Android)

### בפיתוח (live reload מהשרת המקומי)
```bash
# מצא IP מקומי
ipconfig getifaddr en0   # macOS

# הפעל את השרת על כל הממשקים
HOSTNAME=0.0.0.0 npm run dev

# הוסף Android + סנכרן עם השרת
npm run android:add                                  # פעם אחת
CAP_SERVER_URL=http://192.168.x.x:3000 npm run android:sync
npm run android:open
```

ב-Android Studio: Run → בחר במכשיר/אמולטור → ▶️.

> דרישה: המכשיר/אמולטור והמחשב באותה רשת Wi-Fi.

### בניית APK חתום ל-distribution
```bash
npm run android:build
# הקובץ יהיה ב-android/app/build/outputs/apk/release/app-release.apk
```

לחתימה — ראה [Android docs](https://developer.android.com/studio/publish/app-signing).

---

## 8. הרצה רציפה כשירות

### עם pm2
```bash
npm install -g pm2
npm run build
pm2 start "npm run start" --name clubbing
pm2 save
pm2 startup    # מבצע autostart בעת אתחול המחשב
```

### עם systemd (Linux)
צור `/etc/systemd/system/clubbing.service`:
```ini
[Unit]
Description=CLUBBING local server
After=network.target

[Service]
Type=simple
User=clubbing
WorkingDirectory=/opt/clubbing
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```
ואז:
```bash
sudo systemctl enable clubbing
sudo systemctl start clubbing
```

---

## 9. גישה מהרשת המקומית

הפעל על כל הממשקים:
```bash
HOSTNAME=0.0.0.0 PORT=3000 npm run start
```

גש מכל מכשיר באותו Wi-Fi: `http://<LAN-IP>:3000`.

> ⚠️ אל תחשוף את השרת ישירות לאינטרנט ללא HTTPS. השתמש ב-Nginx + certbot, או ב-Cloudflare Tunnel.

---

## 10. תקלות נפוצות

| תופעה | פתרון |
| --- | --- |
| `EADDRINUSE :3000` | יש כבר תהליך על פורט 3000. `lsof -i :3000` ואז `kill <pid>` או `PORT=3001 npm run dev` |
| `prisma: client not generated` | `npx prisma generate` |
| כל הנתונים נעלמו | בדוק שלא נמחק `prisma/dev.db`. שחזר מ-backup |
| OAuth שגיאת Redirect | ודא ש-`NEXTAUTH_URL` תואם ל-URL הקליינט |
| WhatsApp לא נשלח | במצב Demo (ללא token) מחזיר קישור wa.me. הוסף `WHATSAPP_ACCESS_TOKEN` |
| Stripe לא מחייב | מצב Demo מאשר אוטומטית. הוסף `STRIPE_SECRET_KEY` |

---

## 11. עדכון שדה / מודל ב-DB

1. ערוך את `prisma/schema.prisma`
2. הפעל:
```bash
npx prisma db push
```
3. אם הוספת שדה Required ללא default — תידרש כתיבת migration ידנית או מחיקת ה-DB (`npm run db:reset`).

---

## 12. סיכום — איפה הכל

| נכס | מיקום |
| --- | --- |
| מסד הנתונים | `prisma/dev.db` |
| תצורה / מפתחות | `.env` |
| לוגי שרת | stdout (או pm2 logs) |
| סכימה | `prisma/schema.prisma` |
| נתוני דמו | `prisma/seed.ts` |
| תצורת Android | `capacitor.config.ts` |
| גיבוי | `backups/*.db` (לפי הסקריפט שלך) |

המערכת מתוכננת ש-**כל** המידע יישאר על המחשב שלך. אין שירות מרוחק שמחזיק על המידע גישה — לא Vercel, לא Postgres ענן, ולא ספקי קונפיג חיצוניים.
