# פריסה ל-Vercel

## 1. חיבור ל-GitHub

```bash
cd clubbing
git init
git add .
git commit -m "Initial commit"
```

צור ריפו חדש ב-GitHub: https://github.com/new  
שם: `clubbing` (או כל שם שתרצה)

```bash
git remote add origin https://github.com/YOUR_USERNAME/clubbing.git
git branch -M main
git push -u origin main
```

## 2. פריסה ב-Vercel

1. היכנס ל-[vercel.com](https://vercel.com) והתחבר עם GitHub
2. **Import** → בחר את הריפו `clubbing`
3. **Configure Project:**
   - Framework: Next.js (זוהה אוטומטית)
   - Root Directory: `clubbing` (אם הריפו הוא בתיקיית Clubing)
4. **Environment Variables** — הוסף:

| משתנה | ערך |
|-------|-----|
| `DATABASE_URL` | **חשוב:** SQLite לא עובד ב-Vercel. השתמש ב-[Vercel Postgres](https://vercel.com/storage/postgres) (חינם) או [Turso](https://turso.tech) |
| `AUTH_SECRET` | מפתח אקראי (למשל: `openssl rand -base64 32`) |
| `AUTH_URL` | `https://YOUR_APP.vercel.app` (אחרי הפריסה הראשונה) |

5. **Database:** אם משתמש ב-Vercel Postgres — צור Storage, העתק את `POSTGRES_URL` ל-`DATABASE_URL`
6. **שינוי ל-Postgres:** עדכן `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
7. Deploy!

## 3. הרצת Seed (אחרי הפריסה)

אם יש לך גישה ל-DATABASE_URL של הפרודקשן:
```bash
DATABASE_URL="your-postgres-url" npm run db:seed
```
