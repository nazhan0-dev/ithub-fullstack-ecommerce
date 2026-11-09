# IT Hub — ร้านค้าออนไลน์อุปกรณ์ไอที

เว็บร้านค้าออนไลน์แบบ Full-stack มีหน้าร้านสำหรับลูกค้า และหลังร้านสำหรับผู้ดูแลระบบ

| ส่วน | เทคโนโลยี |
|---|---|
| `client/` | React 19, Vite, Tailwind CSS 4, shadcn/ui, Zustand, React Router, Swiper, Stripe Elements |
| `server/` | Node.js, Express 5, MySQL 8 (`mysql2`), JWT ใน httpOnly cookie, Cloudinary, Stripe |

**สารบัญ** — [ความสามารถ](#ความสามารถ) · [ติดตั้งและรันครั้งแรก](#ติดตั้งและรันครั้งแรก) · [บัญชีเข้าสู่ระบบ](#บัญชีเข้าสู่ระบบ) · [ฐานข้อมูล](#ฐานข้อมูล) · [ตัวแปรสภาพแวดล้อม](#ตัวแปรสภาพแวดล้อม) · [การเข้าสู่ระบบและความปลอดภัย](#การเข้าสู่ระบบและความปลอดภัย) · [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย) · [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์) · [แก้ปัญหาที่พบบ่อย](#แก้ปัญหาที่พบบ่อย)

---

## ความสามารถ

**หน้าร้าน (ลูกค้า)**
- หน้าแรก: สไลด์แบนเนอร์, หมวดหมู่, สินค้ายอดนิยม, สินค้าใหม่
- ร้านค้า: ค้นหา + กรองตามหมวดหมู่และช่วงราคา (ใช้พร้อมกันได้ แชร์ลิงก์ได้)
- ตะกร้า → กรอกที่อยู่ → ชำระเงินด้วยบัตรผ่าน Stripe → ประวัติการสั่งซื้อ
- หน้าเกี่ยวกับเรา, สมัครสมาชิก / เข้าสู่ระบบ

**หลังร้าน (admin)** — `/admin`
- แดชบอร์ด: ยอดขาย, กราฟรายวัน/รายเดือน, สถานะคำสั่งซื้อ, สินค้าขายดี, สินค้าใกล้หมด
- คำสั่งซื้อ: กรองตามสถานะ, ค้นหา, เปลี่ยนสถานะ
- สินค้า / หมวดหมู่: เพิ่ม แก้ไข ลบ อัปโหลดรูป
- ผู้ใช้งาน: เปลี่ยนสิทธิ์, ระงับบัญชี

ทุกหน้ารองรับมือถือ

## ติดตั้งและรันครั้งแรก

**สิ่งที่ต้องมี:** Node.js 20.12 ขึ้นไป (แนะนำ 22+), MySQL 8, บัญชี [Cloudinary](https://console.cloudinary.com) (อัปโหลดรูป) และ [Stripe](https://dashboard.stripe.com/test/apikeys) แบบ test mode (ชำระเงิน)

### 1. สร้างฐานข้อมูล

ใน MySQL Workbench (หรือ `mysql` command line):

```sql
CREATE DATABASE ecom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

แล้ว import [`server/db/schema.sql`](server/db/schema.sql) — Workbench: **Server › Data Import › Import from Self-Contained File** เลือกไฟล์นี้ และเลือก schema `ecom`

```bash
# หรือใช้ command line
mysql -u root -p ecom < server/db/schema.sql
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env        # แล้วแก้ค่าใน .env ให้ถูกต้อง (ดูหัวข้อ "ตัวแปรสภาพแวดล้อม")
npm run seed                # สร้างบัญชีผู้ดูแลระบบ
npm start                   # รันที่ http://localhost:8000
```

### 3. Frontend (เปิดอีกเทอร์มินัล)

```bash
cd client
npm install
npm run dev                 # รันที่ http://localhost:5173
```

เปิดเบราว์เซอร์ที่ **http://localhost:5173**

## บัญชีเข้าสู่ระบบ

| บทบาท | อีเมล | รหัสผ่าน | หลัง login ไปที่ |
|---|---|---|---|
| ผู้ดูแลระบบ | `admin@ithub.com` | `Admin@1234` | `/admin` |
| ลูกค้า | สมัครเองที่หน้า `/register` | — | หน้าที่เปิดค้างไว้ |

- บัญชี admin สร้างโดย `npm run seed` — เปลี่ยนอีเมล/รหัสผ่านได้ที่ `ADMIN_EMAIL` / `ADMIN_PASSWORD` ใน `server/.env` แล้วรันคำสั่งเดิมอีกครั้ง
- **ลืมรหัสผ่าน admin?** รัน `npm run seed` อีกครั้ง ระบบจะรีเซ็ตเป็นค่าใน `.env`
- เปลี่ยนผู้ใช้คนอื่นเป็น admin ได้ที่เมนู **ผู้ใช้งาน** ในหลังร้าน
- ⚠️ รหัสผ่านข้างต้นใช้สำหรับพัฒนาในเครื่องเท่านั้น ต้องเปลี่ยนก่อนนำขึ้นใช้งานจริง

**ทดสอบชำระเงิน (Stripe test mode):** บัตร `4242 4242 4242 4242` วันหมดอายุเป็นวันในอนาคตใดก็ได้ CVC 3 หลักใดก็ได้

## ฐานข้อมูล

ใช้ **MySQL 8** ผ่าน package `mysql2` เขียน SQL ตรง ๆ ใน `server/controllers/` — เปิดดูและแก้ข้อมูลได้ใน **MySQL Workbench**

| ตาราง | เก็บอะไร |
|---|---|
| `user` | ผู้ใช้ (รหัสผ่านเข้ารหัสด้วย bcrypt), สิทธิ์, สถานะ, ที่อยู่ |
| `category` / `product` / `image` | หมวดหมู่, สินค้า, รูปสินค้า (ไฟล์จริงอยู่บน Cloudinary) |
| `cart` / `productoncart` | ตะกร้าของลูกค้าแต่ละคน |
| `order` / `productonorder` | คำสั่งซื้อ และรายการสินค้าในคำสั่งซื้อ |

**แก้โครงสร้างตาราง** (เพิ่มคอลัมน์/ตาราง)
1. แก้ใน Workbench
2. แก้ SQL ใน `server/controllers/` ให้ตรงกัน
3. ส่งออกโครงสร้างใหม่เป็น `schema.sql` สำหรับติดตั้งครั้งต่อไป
4. ถ้ามีฐานข้อมูลอื่นที่ต้องอัปเดตตาม ให้เขียนคำสั่ง `ALTER TABLE` เก็บไว้ใน `server/db/migrations/` (ตั้งชื่อเรียงลำดับ เช่น `003_xxx.sql`)

```bash
mysqldump -u root -p --no-data --skip-comments ecom > server/db/schema.sql
```

**ฐานข้อมูลที่ติดตั้งจาก `schema.sql` รุ่นเก่า** ให้รันไฟล์ใน [`server/db/migrations/`](server/db/migrations/) ตามลำดับเลข (ติดตั้งใหม่จาก `schema.sql` ปัจจุบันไม่ต้องรัน)

**สำรอง / กู้คืนข้อมูล**

| งาน | Workbench | คำสั่ง |
|---|---|---|
| สำรอง | Server › Data Export | `mysqldump -u root -p ecom > backup.sql` |
| กู้คืน | Server › Data Import | `mysql -u root -p ecom < backup.sql` |

เก็บไฟล์สำรองไว้ใน `server/backup/` ได้ (โฟลเดอร์นี้ไม่ถูก commit เพราะมีข้อมูลผู้ใช้)

> **เวลาในฐานข้อมูลเป็น UTC** (เวลาไทย = UTC + 7) ตอนเพิ่มข้อมูลเองใน Workbench ให้ใช้ `UTC_TIMESTAMP(3)`
> **ยอดเงิน:** `cartTotal` / `price` เป็นบาท ส่วน `order.amount` เป็นสตางค์ (ยอดที่ Stripe ตัดจริง)

## ตัวแปรสภาพแวดล้อม

ไฟล์ `.env` ทั้งสองฝั่งอยู่ใน `.gitignore` แล้ว — **ห้าม commit**

**`server/.env`** (ตัวอย่าง: [`server/.env.example`](server/.env.example))

| ตัวแปร | จำเป็น | ใช้ทำอะไร |
|---|---|---|
| `DATABASE_URL` | ✅ | การเชื่อมต่อ MySQL เช่น `mysql://root:password@localhost:3306/ecom` |
| `SECRET` | ✅ | คีย์สำหรับเซ็น JWT — ตั้งเป็นข้อความสุ่มยาว ๆ |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | ✅ | อัปโหลดรูปสินค้า |
| `STRIPE_SECRET_KEY` | ✅ | ชำระเงิน (`sk_test_...`) |
| `PORT` | | พอร์ตของ API (ค่าเริ่มต้น `8000`) |
| `CLIENT_URL` | | หน้าเว็บที่อนุญาตให้เรียก API คั่นหลายที่ด้วย `,` (ค่าเริ่มต้น `http://localhost:5173`) |
| `NODE_ENV` | | ตั้ง `production` ตอนใช้งานจริง → cookie ส่งผ่าน HTTPS เท่านั้น |
| `COOKIE_SAMESITE` | | ค่าเริ่มต้น `lax` — ตั้ง `none` เมื่อหน้าเว็บกับ API อยู่คนละโดเมน (ต้องใช้ HTTPS) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | | บัญชีที่ `npm run seed` สร้าง |

**`client/.env`** (ไม่บังคับ — ตัวอย่าง: [`client/.env.example`](client/.env.example))

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `VITE_API_URL` | ที่อยู่ API (ค่าเริ่มต้น `http://localhost:8000/api`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) ต้องมาจากบัญชีเดียวกับ `STRIPE_SECRET_KEY` |

แก้ `.env` แล้วต้องรีสตาร์ตทั้ง server และ `npm run dev`

## การเข้าสู่ระบบและความปลอดภัย

**Token เก็บใน httpOnly cookie**
- login สำเร็จ server จะส่ง cookie ชื่อ `token` (JWT อายุ 1 วัน) — JavaScript บนหน้าเว็บ**อ่านไม่ได้** จึงถูกขโมยผ่าน XSS ไม่ได้
- หน้าเว็บไม่เก็บ token ใน `localStorage` (เก็บแค่ข้อมูลผู้ใช้สำหรับแสดงผลและตะกร้า)
- cookie หมดอายุ → server ตอบ `401` → หน้าเว็บล้างสถานะ login และพาไปหน้า login อัตโนมัติ
- ออกจากระบบ → server ลบ cookie

**การป้องกันอื่น ๆ**
- **สิทธิ์:** API ที่แก้ไขข้อมูลร้านใช้ได้เฉพาะ admin, บัญชีที่ถูกระงับใช้งาน API ไม่ได้
- **CSRF:** request ที่แก้ไขข้อมูลต้องมาจากหน้าเว็บใน `CLIENT_URL` + cookie เป็น `SameSite=Lax`
- **ราคา:** ตะกร้าคิดราคาจากฐานข้อมูลเสมอ ไม่เชื่อราคาที่ส่งมาจากหน้าเว็บ
- **การชำระเงิน:** server ตรวจกับ Stripe โดยตรงว่าชำระสำเร็จ ยอดตรง เป็นของผู้ใช้คนนั้น และใช้สร้างคำสั่งซื้อได้ครั้งเดียว — ถ้าของหมดระหว่างชำระ จะคืนเงินอัตโนมัติ
- **ฐานข้อมูล:** ทุก query ใช้ parameter (`?`) กัน SQL injection, การสร้างคำสั่งซื้อ/ตัดสต็อกทำใน transaction

**นำขึ้นใช้งานจริง:** ใช้ HTTPS, ตั้ง `NODE_ENV=production`, เปลี่ยน `SECRET` และรหัสผ่าน admin, ตั้ง `CLIENT_URL` เป็นโดเมนจริง
ถ้าหน้าเว็บกับ API อยู่คนละโดเมน (เช่น `shop.com` กับ `api.other.com`) ต้องตั้ง `COOKIE_SAMESITE=none` ด้วย — แนะนำให้อยู่โดเมนเดียวกัน (เช่น `shop.com` กับ `api.shop.com`) จะใช้ค่าเริ่มต้นได้เลย

## คำสั่งที่ใช้บ่อย

| ที่ | คำสั่ง | ทำอะไร |
|---|---|---|
| `server/` | `npm start` | รัน API (รีสตาร์ตอัตโนมัติเมื่อแก้โค้ด) |
| `server/` | `npm run seed` | สร้าง / รีเซ็ตบัญชี admin |
| `client/` | `npm run dev` | รันหน้าเว็บโหมดพัฒนา |
| `client/` | `npm run build` | build สำหรับใช้งานจริง (ผลลัพธ์อยู่ใน `client/dist`) |
| `client/` | `npm run lint` | ตรวจโค้ดด้วย ESLint |

## โครงสร้างโปรเจกต์

```
client/
  public/                 favicon และไอคอน
  src/
    api/                  ฟังก์ชันเรียก API (client.js = axios + ส่ง cookie)
    assets/               โลโก้ และรูปแบนเนอร์
    components/
      admin/              Sidebar, Header, ฟอร์มสินค้า, กราฟแดชบอร์ด
      card/               การ์ดสินค้า, แผงตัวกรอง
      home/               ส่วนประกอบหน้าแรก (สไลด์, หมวดหมู่, รายการสินค้า)
      ui/                 คอมโพเนนต์ shadcn/ui
    layouts/              Layout หน้าร้าน / สมาชิก / admin
    pages/                หน้าเว็บ (หน้าร้าน, auth, user, admin)
    routes/               เส้นทาง และการตรวจสิทธิ์ (ProtectRoute)
    store/                Zustand store (ข้อมูลผู้ใช้, ตะกร้า, สินค้า)
    utils/                จัดรูปแบบตัวเลข/วันที่, สถานะคำสั่งซื้อ, ค่าเริ่มต้นฟอร์มสินค้า
server/
  config/                 db.js (MySQL), stripe.js, authCookie.js (ตั้งค่า cookie)
  controllers/            ตรรกะของแต่ละ API
  middlewares/            ตรวจ token และสิทธิ์ admin
  routes/                 เส้นทาง API (โหลดอัตโนมัติทุกไฟล์)
  db/
    schema.sql            โครงสร้างตาราง (ใช้ติดตั้งครั้งแรก)
    migrations/           SQL สำหรับอัปเดตฐานข้อมูลรุ่นเก่า
    seed.js               สร้างบัญชี admin
  backup/                 ไฟล์สำรองฐานข้อมูล (ไม่ถูก commit)
  server.js               จุดเริ่มต้นของ API
```

รายการ API ทั้งหมดและสิทธิ์ที่ต้องใช้: [`server/README.md`](server/README.md)

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| หน้าเว็บเป็นสีขาวทั้งหน้า | dev server ค้างหลังติดตั้ง/ลบ package — หยุด `npm run dev` (Ctrl+C) แล้วรันใหม่ ถ้ายังขาวใช้ `npx vite --force` |
| ไม่มีสินค้า / login ไม่ได้ | server ยังไม่รัน หรือ MySQL ปิดอยู่ — ดูเทอร์มินัลของ `server` |
| login ได้แต่เด้งกลับหน้า login | cookie ไม่ถูกส่ง — ตรวจว่า `CLIENT_URL` ใน `server/.env` ตรงกับที่อยู่หน้าเว็บ (รวม port) และเปิดเว็บด้วย `localhost` ไม่ใช่ `127.0.0.1` |
| `Origin not allowed` | เปิดหน้าเว็บจากที่อยู่ที่ไม่อยู่ใน `CLIENT_URL` — เพิ่มที่อยู่นั้นใน `.env` (คั่นด้วย `,`) |
| `User not found or not Enabled` | อีเมลผิด หรือบัญชีถูกระงับ — admin รัน `npm run seed` เพื่อรีเซ็ต |
| อัปโหลดรูปไม่ได้ | ค่า `CLOUDINARY_*` ใน `server/.env` ไม่ถูกต้อง |
| หน้าชำระเงินขึ้น error | `STRIPE_SECRET_KEY` ไม่ถูกต้อง หรือ key ฝั่ง client/server มาจากคนละบัญชี Stripe |
| ลบสินค้าไม่ได้ | สินค้าอยู่ในตะกร้าลูกค้าหรือมีในคำสั่งซื้อแล้ว (เก็บไว้เป็นประวัติ) — ตั้งจำนวนคงเหลือเป็น 0 แทน |
| ไอคอนแท็บยังเป็นอันเก่า | กด Ctrl+F5 เพื่อล้างแคช |
