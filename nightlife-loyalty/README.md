# NightLife Loyalty Platform — MVP

פלטפורמת נאמנות למועדונים לפי מסמך האפיון SRS v1.0.

## התקנה והרצה

```bash
npm install
npm run db:seed    # יצירת 2 מועדוני דמו
npm run dev       # הפעלת שרת פיתוח
```

פתח [http://localhost:3000](http://localhost:3000)

## תכונות MVP

- **הרשמה/התחברות** — OTP לפי מספר טלפון (בפיתוח: הקוד מוצג בקונסול)
- **מסך בית** — בחירת מועדון, כפתורים "קח אותי לשם" ו"סגור לי את הערב"
- **Pass + QR** — יצירת Pass, הצגת QR לסריקה בכניסה
- **Check-in** — ממשק צוות לסריקת QR ואישור כניסה
- **הזנת עסקאות** — ידנית, צבירת 5% קרדיטים
- **ארנק** — יתרה, היסטוריה, מימוש (Voucher Mode)
- **דשבורד** — GMV, מבקרים, ממוצע הוצאה, Tiering
- **קמפיינים** — בונוס קרדיטים לפי פילטר (ביקור ב-30 יום)

## מבנה

- `/` — דף בית (נדרשת התחברות)
- `/auth` — התחברות/הרשמה
- `/clubs/[id]` — דף מועדון
- `/clubs/[id]/pass` — יצירת Pass + QR
- `/profile` — פרופיל + ארנק
- `/wallet` — ארנק מפורט + מימוש
- `/staff` — ממשק צוות (סריקה, עסקאות, מבקרים)
- `/dashboard` — דשבורד ניהולי + קמפיינים

## API

- `POST /api/auth/otp/request` — בקשת OTP
- `POST /api/auth/otp/verify` — אימות OTP + JWT
- `GET /api/clubs` — רשימת מועדונים
- `POST /api/clubs/:id/passes` — יצירת Pass
- `POST /api/crm/checkin` — Check-in לפי qr_token
- `POST /api/crm/transaction` — הזנת עסקה
- `GET /api/wallet?club_id=` — יתרה
- `POST /api/wallet/redeem` — מימוש קרדיטים

## מסד נתונים

SQLite (`prisma/dev.db`). להרצת migrations:

```bash
npx prisma db push
```
