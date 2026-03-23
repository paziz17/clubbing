# הרצה מקומית

## מה תוקן

- `DATABASE_URL` חייב להיות **PostgreSQL** (לא SQLite). ב-`.env` מוגדר חיבור ל־Postgres מקומי.

## דרישות

- Node.js 20+
- PostgreSQL מקומי (פורט 5432) **או** Docker

## שלבים

### 1. יצירת מסד `clubing` (פעם אחת)

```bash
psql -d postgres -c "CREATE DATABASE clubing;"
```

### 2. עדכון `.env`

```env
DATABASE_URL="postgresql://USER@localhost:5432/clubing"
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=<לפחות 32 תווים>
```

החלף `USER` בשם המשתמש של Postgres במחשב שלך (למשל `omer` ב-macOS ללא סיסמה).

### 3. סנכרון Prisma והרצה

```bash
npx prisma db push
npm run dev
```

פתח: **http://localhost:3000**

## עם Docker (אם אין Postgres מקומי)

```bash
docker compose up -d
# עדכן DATABASE_URL ל:
# postgresql://clubing:clubing_local@localhost:5432/clubing
npx prisma db push
npm run dev
```

או: `./scripts/start-local.sh` (אחרי `chmod +x scripts/start-local.sh`)
