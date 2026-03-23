# מפרט שרת פרודקשן — Clubing (אבטחה מקסימלית)

## סקירת המערכת

| רכיב | טכנולוגיה |
|------|-----------|
| Frontend + API | Next.js 16 |
| Database | PostgreSQL |
| Auth | NextAuth (OAuth: Google, Facebook, Instagram) |
| Runtime | Node.js 20+ |

---

## אופציה 1: Vercel + Managed DB (הכי פשוט, מומלץ להתחלה)

**יתרונות:** אפס תחזוקה, SSL אוטומטי, CDN גלובלי, אבטחה מובנית.

| רכיב | שירות | מפרט |
|------|--------|------|
| Hosting | Vercel Pro | $20/חודש — SSL, DDoS protection, WAF |
| Database | Vercel Postgres (Neon) | 256MB RAM, 0.25 vCPU — חינם/בסיסי |
| או | Neon Pro / Supabase Pro | ~$25/חודש — יותר כוח |
| Secrets | Vercel Env Vars | מוצפנים, לא נחשפים ללקוח |

**אבטחה:**
- HTTPS אוטומטי (Let's Encrypt)
- Vercel Firewall (WAF)
- Environment variables מוצפנים
- VPC isolation (עם Vercel Enterprise)

---

## אופציה 2: שרת ענן ייעודי (AWS / GCP / Azure)

### מפרט חומרה מומלץ

| רכיב | מינימום | מומלץ | גבוה |
|------|---------|-------|------|
| **vCPU** | 2 | 4 | 8 |
| **RAM** | 4 GB | 8 GB | 16 GB |
| **Storage** | 40 GB SSD | 80 GB SSD | 160 GB SSD |
| **Bandwidth** | 2 TB/חודש | 5 TB | ללא הגבלה |

### דוגמאות ספקים

| ספק | מופע | מפרט | מחיר משוער |
|-----|------|------|------------|
| **AWS** | EC2 t3.medium | 2 vCPU, 4GB RAM | ~$30/חודש |
| **AWS** | EC2 t3.large | 2 vCPU, 8GB RAM | ~$60/חודש |
| **GCP** | e2-standard-2 | 2 vCPU, 8GB RAM | ~$50/חודש |
| **GCP** | e2-standard-4 | 4 vCPU, 16GB RAM | ~$100/חודש |
| **DigitalOcean** | Droplet | 2 vCPU, 4GB RAM | ~$24/חודש |
| **Hetzner** | CX31 | 4 vCPU, 8GB RAM | ~€15/חודש |
| **OVH** | B2-7 | 4 vCPU, 8GB RAM | ~€25/חודש |

---

## ארכיטקטורה מומלצת (אבטחה מקסימלית)

```
                    ┌─────────────────────────────────────────┐
                    │           CloudFlare / AWS WAF          │
                    │  DDoS • Bot protection • Rate limiting  │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │              Load Balancer              │
                    │         SSL termination (TLS 1.3)        │
                    └─────────────────┬───────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   App Server 1  │        │   App Server 2  │        │   App Server N  │
│   Next.js       │        │   Next.js       │        │   Next.js       │
│   Node 20       │        │   Node 20       │        │   Node 20       │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Managed PostgreSQL          │
                    │   (RDS / Cloud SQL / Neon)    │
                    │   Encryption at rest         │
                    │   Private subnet              │
                    └───────────────────────────────┘
```

---

## שכבות אבטחה — מפרט

### 1. רשת (Network)

| רכיב | הגדרה |
|------|--------|
| **Firewall** | פתוח רק: 80 (HTTP→HTTPS redirect), 443 (HTTPS) |
| **SSH** | רק מ-IP ספציפי או VPN, מפתח ולא סיסמה |
| **VPC** | App servers ו-DB ב-subnets נפרדים |
| **Security Groups** | DB לא חשוף לאינטרנט — רק מ-App servers |

### 2. SSL/TLS

| פריט | ערך |
|------|-----|
| פרוטוקול | TLS 1.3 (מינימום 1.2) |
| Certificate | Let's Encrypt או AWS ACM |
| HSTS | מופעל (Strict-Transport-Security) |
| Cipher suites | מודרניים בלבד (ECDHE, AES-GCM) |

### 3. אפליקציה

| פריט | הגדרה |
|------|--------|
| **Secrets** | Vault / AWS Secrets Manager / Doppler — לא ב-env files |
| **AUTH_SECRET** | 32+ תווים אקראיים, מוחלף תקופתית |
| **Database URL** | SSL mode=require, חיבור פרטי |
| **Headers** | X-Frame-Options, X-Content-Type-Options, CSP |
| **Rate limiting** | על login, API, OAuth callbacks |

### 4. מסד נתונים

| פריט | הגדרה |
|------|--------|
| **Encryption** | At-rest (AES-256) ו-in-transit (TLS) |
| **Backups** | יומי אוטומטי, retention 30 יום |
| **Access** | רק מ-App layer, לא מ-internet |
| **User** | משתמש ייעודי עם הרשאות מינימליות |

### 5. ניטור ולוגים

| פריט | כלי |
|------|-----|
| **Logs** | CloudWatch / Datadog / Grafana Loki |
| **Alerts** | על שגיאות, ניסיונות פריצה, CPU/RAM |
| **Uptime** | UptimeRobot / Pingdom |
| **APM** | Vercel Analytics / New Relic |

---

## מפרט שרת מינימלי לפרודקשן (VM יחיד)

להתחלה — שרת אחד שמחזיק הכל:

```
┌─────────────────────────────────────────────────────────────┐
│  VM: 2 vCPU, 4GB RAM, 40GB SSD                               │
│  OS: Ubuntu 24.04 LTS                                        │
├─────────────────────────────────────────────────────────────┤
│  • Node.js 20 LTS                                             │
│  • PM2 (process manager)                                     │
│  • Nginx (reverse proxy, SSL, static files)                   │
│  • PostgreSQL 16 (או חיבור ל-managed DB)                      │
│  • Fail2ban (הגנה מפני brute-force)                           │
│  • UFW (firewall)                                             │
└─────────────────────────────────────────────────────────────┘
```

### פקודות התקנה בסיסיות (Ubuntu)

```bash
# Firewall
ufw allow 22/tcp   # SSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# PM2
npm i -g pm2

# Nginx + Certbot (SSL)
apt install nginx certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## עלויות משוערות (חודשי)

| אופציה | רכיבים | עלות |
|--------|--------|------|
| **מינימלי** | Vercel Hobby + Neon Free | $0 |
| **בסיסי** | Vercel Pro + Neon/Supabase | ~$45 |
| **שרת יחיד** | Hetzner CX31 + CloudFlare | ~€20 |
| **מקצועי** | AWS/GCP (App + RDS + WAF) | ~$150–300 |
| **Enterprise** | Multi-region, HA, SOC2 | $500+ |

---

## המלצה לפי שלב

| שלב | אופציה | סיבה |
|-----|--------|------|
| **השקה** | Vercel Pro + Neon/Supabase | פשוט, מאובטח, ללא תחזוקה |
| **צמיחה** | שרת VM (Hetzner/DO) + managed DB | שליטה מלאה, עלות נמוכה |
| **סקייל** | AWS/GCP עם Load Balancer + RDS | HA, גיבויים, compliance |

---

## צעדים מיידיים לאבטחה (גם ב-Vercel)

1. **AUTH_SECRET** — מפתח חזק 32+ תווים, לא לשתף
2. **משתני סביבה** — רק ב-Vercel/Cloud, לא ב-Git
3. **OAuth** — Redirect URIs מדויקים, Client Secret מוגן
4. **Database** — חיבור עם SSL, משתמש עם הרשאות מינימליות
5. **Headers** — הוסף `next.config.ts` security headers

---

# פתרון "הכל במקום אחד" — פלטפורמה אחת לכל הצרכים

## אופציה מומלצת: AWS (הכול תחת קורת גג אחת)

AWS מאפשרת לנהל **הכל** ממקום אחד: אפליקציה, DB, גיבויים, EDR, ניטור, WAF.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS — הכל במקום אחד                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  אפליקציה      │ EC2 / ECS / App Runner     │ שרת או containers             │
│  Database      │ RDS PostgreSQL             │ Managed, גיבויים אוטומטיים     │
│  גיבויים       │ AWS Backup / RDS Snapshots│ יומי, retention 30 יום          │
│  EDR/אבטחה    │ GuardDuty + Inspector      │ זיהוי איומים, סריקות          │
│  WAF           │ AWS WAF                    │ הגנה מפני התקפות web          │
│  SSL           │ ACM                        │ תעודות חינם, חידוש אוטומטי     │
│  Secrets       │ Secrets Manager            │ סיסמאות מוצפנות               │
│  לוגים/ניטור  │ CloudWatch                 │ לוגים, מטריקות, התראות         │
│  DNS           │ Route 53                   │ ניהול דומיינים                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### עלות משוערת (AWS — הכל במקום אחד)

| רכיב | שירות | מחיר/חודש |
|------|--------|------------|
| Compute | EC2 t3.medium | ~$30 |
| Database | RDS db.t3.micro (PostgreSQL) | ~$15 |
| גיבויים | AWS Backup (RDS + EBS) | ~$5 |
| אבטחה | GuardDuty | ~$5 |
| WAF | AWS WAF | ~$5–20 |
| **סה"כ** | | **~$60–75** |

---

## גיבויים — אסטרטגיה מלאה

### מה לגבות

| רכיב | תדירות | Retention | כלי |
|------|--------|-----------|-----|
| **PostgreSQL** | יומי (אוטומטי) | 30 יום | RDS Snapshots / pg_dump |
| **קוד** | כל commit | ללא הגבלה | GitHub |
| **משתני סביבה** | ידני (לאחר שינוי) | גרסה אחרונה | Secrets Manager export |
| **קבצי מדיה** | יומי | 30 יום | S3 + versioning |

### סקריפט גיבוי ידני (PostgreSQL)

```bash
#!/bin/bash
# backup-db.sh — הרץ ב-cron יומי
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL | gzip > /backups/clubbing-$DATE.sql.gz
# העלאה ל-S3 (אופציונלי)
# aws s3 cp /backups/clubbing-$DATE.sql.gz s3://your-bucket/backups/
```

### Cron לגיבוי יומי

```bash
# /etc/cron.d/clubbing-backup
0 3 * * * root /opt/clubbing/backup-db.sh
```

### שחזור מאסון (Disaster Recovery)

| תרחיש | פעולה | זמן משוער |
|-------|--------|------------|
| DB corrupt | שחזור מ-RDS snapshot | 15–30 דקות |
| שרת down | הפעלת AMI חדש / EC2 חדש | 10–20 דקות |
| אזור שלם down | Multi-AZ / שחזור מאזור אחר | 1–2 שעות |

---

## EDR ואבטחת endpoints

### AWS (מובנה — בלי התקנה על השרת)

| שירות | תפקיד | מחיר |
|-------|--------|------|
| **GuardDuty** | זיהוי איומים, ניתוח לוגים | ~$5/חודש |
| **Inspector** | סריקת פגיעויות ב-EC2 | ~$5/חודש |
| **Security Hub** | לוח בקרה מרכזי לאבטחה | כלול |

### EDR Agent על השרת (אם צריך)

| פתרון | סוג | מחיר |
|-------|-----|------|
| **Wazuh** | Open source | חינם |
| **CrowdStrike** | Enterprise | ~$8/endpoint/חודש |
| **SentinelOne** | Enterprise | ~$8/endpoint/חודש |

### התקנת Wazuh (חינמי)

```bash
# על Ubuntu 24.04
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
sudo bash wazuh-install.sh -a
# ניהול: Wazuh Dashboard (Elastic Stack)
```

---

## ניטור ולוגים — הכל במקום אחד

### AWS CloudWatch (מובנה)

| רכיב | שימוש |
|------|--------|
| **Logs** | לוגי אפליקציה, Nginx, PostgreSQL |
| **Metrics** | CPU, RAM, Disk, Requests |
| **Alarms** | התראה ב-SMS/Email כשמשהו קורה |
| **Dashboards** | לוח בקרה מרכזי |

### Grafana Cloud (אלטרנטיבה — חינם עד 10K מטריקות)

- חיבור ל-CloudWatch / Prometheus
- דשבורדים יפים
- התראות

---

## רשימת צ'ק — פריסה מלאה

### לפני השקה

- [ ] SSL מופעל (HTTPS)
- [ ] Firewall: רק 80, 443
- [ ] SSH: מפתח בלבד, לא סיסמה
- [ ] Database: SSL, גיבויים יומיים
- [ ] Secrets: ב-Secrets Manager, לא בקוד
- [ ] גיבוי: נבדק ששחזור עובד

### אחרי השקה

- [ ] GuardDuty / EDR מופעל
- [ ] התראות על שגיאות
- [ ] Uptime monitoring (Pingdom / UptimeRobot)
- [ ] תיעוד: איך משחזרים, מי אחראי

---

## סיכום — "הכל במקום אחד"

| צורך | פתרון (AWS) |
|------|-------------|
| אפליקציה | EC2 / App Runner |
| Database | RDS PostgreSQL |
| גיבויים | RDS Snapshots + AWS Backup |
| EDR/אבטחה | GuardDuty + Inspector |
| WAF | AWS WAF |
| SSL | ACM |
| Secrets | Secrets Manager |
| לוגים/ניטור | CloudWatch |
| DNS | Route 53 |

**מחיר משוער:** ~$60–100/חודש לכל המערכת המאובטחת.
