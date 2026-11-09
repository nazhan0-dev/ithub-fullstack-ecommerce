# IT Hub — ร้านค้าออนไลน์อุปกรณ์ไอที

เว็บร้านค้าออนไลน์แบบ Full-stack ประกอบด้วยหน้าร้านสำหรับลูกค้า (ค้นหา/กรองสินค้า, ตะกร้า, ชำระเงินผ่าน Stripe, ประวัติการสั่งซื้อ) และหลังร้านสำหรับผู้ดูแลระบบ (แดชบอร์ด, จัดการสินค้า, หมวดหมู่, คำสั่งซื้อ, ผู้ใช้งาน)

| ส่วน | เทคโนโลยี |
|---|---|
| `client/` | React 19, Vite, Tailwind CSS 4, shadcn/ui, Zustand, React Router, Swiper, Stripe Elements |
| `server/` | Node.js, Express 5, MySQL 8 (mysql2), JWT, Cloudinary, Stripe |

---

## สิ่งที่ต้องมีก่อน

- **Node.js 20.12 ขึ้นไป** (แนะนำ 22+)
- **MySQL 8** ที่รันอยู่ในเครื่อง (เช่น XAMPP, MySQL Workbench หรือ Docker)
- บัญชี **Cloudinary** (สำหรับอัปโหลดรูปสินค้า) และ **Stripe** แบบ test mode (สำหรับชำระเงิน)

## ติดตั้งและรันครั้งแรก

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # แล้วแก้ค่าใน .env ให้ถูกต้อง
# สร้างฐานข้อมูลและตาราง (ทำครั้งแรกครั้งเดียว — ดูหัวข้อ "ฐานข้อมูล" ด้านล่าง)
npm run seed                # สร้างบัญชีผู้ดูแลระบบ
npm start                   # รันที่ http://localhost:8000
```

### 2. Frontend (เปิดอีกเทอร์มินัล)

```bash
cd client
npm install
npm run dev                 # รันที่ http://localhost:5173
```

เปิดเบราว์เซอร์ที่ **http://localhost:5173**

## บัญชีเข้าสู่ระบบ

| บทบาท | อีเมล | รหัสผ่าน | หลัง login จะไปที่ |
|---|---|---|---|
| ผู้ดูแลระบบ | `admin@ithub.com` | `Admin@1234` | `/admin` |
| ลูกค้า | สมัครเองที่หน้า `/register` | — | หน้าที่เปิดค้างไว้ |

- บัญชี admin สร้างโดย `npm run seed` เปลี่ยนอีเมล/รหัสผ่านได้ด้วย `ADMIN_EMAIL` และ `ADMIN_PASSWORD` ใน `server/.env` แล้วรันคำสั่งเดิมอีกครั้ง
- **ลืมรหัสผ่าน admin?** รัน `npm run seed` อีกครั้ง ระบบจะรีเซ็ตรหัสผ่านเป็นค่าใน `.env`
- เปลี่ยนผู้ใช้คนอื่นเป็น admin ได้ที่เมนู **ผู้ใช้งาน** ในหน้า admin
- ⚠️ รหัสผ่านข้างต้นเป็นค่าสำหรับพัฒนาในเครื่องเท่านั้น หากนำขึ้นใช้งานจริงต้องเปลี่ยนก่อน

### ทดสอบชำระเงิน (Stripe test mode)

ใช้บัตรทดสอบ `4242 4242 4242 4242` วันหมดอายุเป็นวันในอนาคตใดก็ได้ และ CVC 3 หลักใดก็ได้

## ฐานข้อมูล

ใช้ **MySQL 8** โดยตรงผ่าน package `mysql2` (ไม่ใช้ Prisma แล้ว) — เปิดดูและแก้ข้อมูลได้ใน **MySQL Workbench**

**ติดตั้งครั้งแรก** (ถ้ายังไม่มีฐานข้อมูล `ecom`)

```sql
CREATE DATABASE ecom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

แล้ว import [`server/db/schema.sql`](server/db/schema.sql) — ใน Workbench: **Server › Data Import › Import from Self-Contained File** เลือกไฟล์นี้ และเลือก schema `ecom`

**แก้โครงสร้างตาราง** (เพิ่มคอลัมน์/ตาราง) ทำใน Workbench ได้เลย แล้วแก้ SQL ใน `server/controllers/` ให้ตรงกัน และอัปเดต `db/schema.sql` ด้วย

```bash
# ส่งออกโครงสร้างล่าสุดเป็น schema.sql
mysqldump -u root -p --no-data --skip-comments ecom > server/db/schema.sql
```

**สำรอง/กู้คืนข้อมูล**

| งาน | Workbench | คำสั่ง |
|---|---|---|
| สำรอง | Server › Data Export | `mysqldump -u root -p ecom > backup.sql` |
| กู้คืน | Server › Data Import | `mysql -u root -p ecom < backup.sql` |

> หมายเหตุ: คอลัมน์ `createdAt` / `updatedAt` เก็บเวลาเป็น **UTC** (เวลาไทย = UTC + 7) ตอนเพิ่มข้อมูลเองใน Workbench ให้ใช้ `UTC_TIMESTAMP(3)`

## ตัวแปรสภาพแวดล้อม

**`server/.env`** (ดูตัวอย่างใน [`server/.env.example`](server/.env.example))

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `DATABASE_URL` | การเชื่อมต่อ MySQL เช่น `mysql://root:password@localhost:3306/ecom` |
| `SECRET` | คีย์สำหรับเซ็น JWT |
| `CLOUNDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | อัปโหลดรูปสินค้า |
| `STRIPE_SECRET_KEY` | สร้างรายการชำระเงิน (`sk_test_...`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | บัญชีที่ `npm run seed` สร้าง |

**`client/.env`** (ไม่บังคับ)

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |

ไฟล์ `.env` ทั้งสองฝั่งอยู่ใน `.gitignore` แล้ว ห้าม commit

## คำสั่งที่ใช้บ่อย

| ที่ | คำสั่ง | ทำอะไร |
|---|---|---|
| `server/` | `npm start` | รัน API (รีสตาร์ตอัตโนมัติเมื่อแก้โค้ด) |
| `server/` | `npm run seed` | สร้าง/รีเซ็ตบัญชี admin |
| `client/` | `npm run dev` | รันหน้าเว็บโหมดพัฒนา |
| `client/` | `npm run build` | build สำหรับนำขึ้นใช้งาน (ผลลัพธ์อยู่ใน `client/dist`) |
| `client/` | `npm run lint` | ตรวจโค้ดด้วย ESLint |

## โครงสร้างโปรเจกต์

```
client/
  public/                 favicon และไอคอน
  src/
    api/                  ฟังก์ชันเรียก API ของ backend
    assets/               โลโก้
    components/
      admin/              Sidebar, Header, ฟอร์มสินค้า, กราฟแดชบอร์ด
      card/               การ์ดสินค้า, แผงตัวกรอง
      home/               ส่วนประกอบหน้าแรก (สไลด์, หมวดหมู่, รายการสินค้า)
      ui/                 คอมโพเนนต์ shadcn/ui
    layouts/              Layout หน้าร้าน / ผู้ใช้ / admin
    pages/                หน้าเว็บ (หน้าร้าน, auth, user, admin)
    routes/               เส้นทาง และการตรวจสิทธิ์ (ProtectRoute)
    store/                Zustand store (ผู้ใช้, ตะกร้า, สินค้า)
    utils/                จัดรูปแบบตัวเลข/วันที่
server/
  config/db.js            การเชื่อมต่อ MySQL และตัวช่วย query
  controllers/            ตรรกะของแต่ละ API
  middllewares/           ตรวจ JWT และสิทธิ์ admin
  db/                     schema.sql (โครงสร้างตาราง), seed.js (สร้างบัญชี admin)
  backup/                 ไฟล์สำรองฐานข้อมูล (ไม่ถูก commit)
  routes/                 เส้นทาง API (โหลดอัตโนมัติทุกไฟล์)
  server.js               จุดเริ่มต้นของ API
```

รายการ API ทั้งหมดดูได้ที่ [`server/README.md`](server/README.md)

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| หน้าเว็บขึ้นแต่ไม่มีสินค้า / login ไม่ได้ | backend ยังไม่รัน หรือ MySQL ปิดอยู่ — ตรวจเทอร์มินัลของ `server` |
| `User not found or not Enabled` | อีเมลผิด หรือบัญชีถูกระงับ — รัน `npm run seed` เพื่อรีเซ็ต admin |
| อัปโหลดรูปไม่ได้ | ค่า Cloudinary ใน `server/.env` ไม่ถูกต้อง |
| หน้าชำระเงินขึ้นข้อความ error | `STRIPE_SECRET_KEY` ไม่ถูกต้อง หรือ key ฝั่ง client/server มาจากคนละบัญชี Stripe |
| ไอคอนแท็บยังเป็นอันเก่า | กด Ctrl+F5 เพื่อล้างแคช |
