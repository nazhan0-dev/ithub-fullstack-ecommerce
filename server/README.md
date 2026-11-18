# IT Hub API

REST API ของร้าน IT Hub — Express 5 + MySQL 8 (`mysql2`)
ทุก endpoint ขึ้นต้นด้วย `http://localhost:8000/api`

วิธีติดตั้งและตั้งค่าทั้งหมดดูที่ [README หลัก](../README.md)

## การยืนยันตัวตน

- `POST /api/login` สำเร็จ → server ส่ง **httpOnly cookie** ชื่อ `token` (JWT) กลับมา ตัว token **ไม่อยู่ใน response body**
- อายุ: ไม่ใช้งานเกิน 2 ชั่วโมงหมดอายุ — request ที่ผ่าน `authCheck` จะได้ cookie ใหม่ (ต่ออายุ) ถ้า token ใช้มาเกิน 5 นาที ต่อได้รวมไม่เกิน 1 วันนับจาก login (เกินแล้วได้ `401 Session expired`) — ส่ง header `X-Background: 1` เพื่อไม่ให้ต่ออายุ
- request ถัดไปเบราว์เซอร์แนบ cookie ให้อัตโนมัติ — ฝั่งหน้าเว็บต้องตั้ง `withCredentials: true` (axios) หรือ `credentials: "include"` (fetch)
- `POST /api/logout` ลบ cookie
- เครื่องมือทดสอบ API (Postman, curl) ส่ง header `Authorization: Bearer <token>` แทน cookie ได้

ตัวอย่างด้วย curl (เก็บ cookie ลงไฟล์ `cookies.txt`):

```bash
curl -c cookies.txt -H "Content-Type: application/json" \
     -d '{"email":"admin@ithub.com","password":"Admin@1234"}' \
     http://localhost:8000/api/login

curl -b cookies.txt http://localhost:8000/api/users
```

## สิทธิ์การเข้าถึง

| สัญลักษณ์ | ความหมาย | ถ้าไม่ผ่าน |
|---|---|---|
| 🌐 สาธารณะ | ไม่ต้อง login | — |
| 👤 สมาชิก | ต้อง login และบัญชีไม่ถูกระงับ | `401` ไม่ได้ login · `403` บัญชีถูกระงับ |
| 🛡️ Admin | ต้อง login และ `role = admin` | `403` |

request ที่แก้ไขข้อมูล (POST / PUT / DELETE) ต้องมาจากหน้าเว็บที่อยู่ใน `CLIENT_URL` เท่านั้น (กัน CSRF) — ไม่อย่างนั้นได้ `403 Origin not allowed`

## Endpoints

### บัญชีผู้ใช้

| Method | Endpoint | สิทธิ์ | Body | ผลลัพธ์ |
|---|---|---|---|---|
| POST | `/register` | 🌐 | `{ "email", "password" }` | `"Register Success"` — อีเมลต้องถูกรูปแบบ (เก็บเป็นตัวพิมพ์เล็ก), รหัสผ่าน 8–72 ตัวอักษร ไม่ผ่านได้ `400` |
| POST | `/login` | 🌐 | `{ "email", "password" }` | `{ payload: { id, email, role } }` + cookie — อีเมล/รหัสผิดได้ `400` ข้อความเดียวกัน, บัญชีถูกระงับ `403`, ผิดบ่อยเกินได้ `429` + header `Retry-After` |
| POST | `/logout` | 🌐 | — | ลบ cookie |
| POST | `/current-user` | 👤 | — | `{ user }` |
| POST | `/current-admin` | 🛡️ | — | `{ user }` |

### หมวดหมู่

| Method | Endpoint | สิทธิ์ | Body |
|---|---|---|---|
| GET | `/category` | 🌐 | — |
| POST | `/category` | 🛡️ | `{ "name": "Monitor" }` |
| DELETE | `/category/:id` | 🛡️ | — (สินค้าในหมวดนี้จะไม่มีหมวดหมู่) |

### สินค้า

| Method | Endpoint | สิทธิ์ | Body / หมายเหตุ |
|---|---|---|---|
| GET | `/products/:count` | 🌐 | สินค้าล่าสุด `count` รายการ พร้อม `category` และ `images` |
| GET | `/product/:id` | 🌐 | `404` ถ้าไม่พบ |
| POST | `/productby` | 🌐 | `{ "sort": "sold", "order": "desc", "limit": 12 }` — `sort`: `id` `title` `price` `sold` `quantity` `createdAt` `updatedAt` |
| POST | `/search/filters` | 🌐 | `{ "query": "mouse", "category": [1, 2], "price": [100, 5000] }` — ใส่ช่องเดียวหรือหลายช่องพร้อมกันได้ |
| POST | `/product` | 🛡️ | `{ "title", "description", "price", "quantity", "categoryId", "lowStockThreshold", "images": [] }` — `lowStockThreshold` ไม่ส่ง = 5, `0` = ไม่แจ้งเตือน |
| PUT | `/product/:id` | 🛡️ | เหมือน POST — `images` จะแทนที่รูปเดิมทั้งหมด |
| DELETE | `/product/:id` | 🛡️ | ลบไม่ได้ถ้าสินค้าอยู่ในตะกร้าหรือคำสั่งซื้อแล้ว (`400`) |
| POST | `/images` | 🛡️ | `{ "image": "<base64>" }` อัปโหลดขึ้น Cloudinary — body ได้ถึง 8mb (endpoint อื่น 1mb) |
| POST | `/removeimages` | 🛡️ | `{ "public_id" }` ลบรูปจาก Cloudinary |

### ตะกร้าและคำสั่งซื้อ (ลูกค้า)

| Method | Endpoint | สิทธิ์ | Body / หมายเหตุ |
|---|---|---|---|
| POST | `/user/cart` | 👤 | `{ "cart": [{ "id": 1, "count": 2 }] }` — ราคาใช้จากฐานข้อมูลเสมอ, เกินสต็อกได้ `400` |
| GET | `/user/cart` | 👤 | `{ products, cartTotal }` |
| DELETE | `/user/cart` | 👤 | ล้างตะกร้า |
| POST | `/user/address` | 👤 | `{ "address": "..." }` |
| POST | `/user/cart/coupon` | 👤 | `{ "code": "WELCOME10" }` → `{ subtotal, discount, total, coupon }` — ไม่ผ่านเงื่อนไขได้ `400` พร้อมเหตุผล |
| DELETE | `/user/cart/coupon` | 👤 | ถอดโค้ดออกจากตะกร้า |
| POST | `/user/create-payment-intent` | 👤 | สร้างการชำระเงินจากยอดตะกร้า**หลังหักส่วนลด** → `{ clientSecret, subtotal, discount, total, coupon }` |
| POST | `/user/order` | 👤 | `{ "paymentIntent": { "id": "pi_..." } }` → `{ ok, order }` — server ตรวจกับ Stripe ว่าชำระสำเร็จ, ยอดตรง, เป็นของผู้ใช้คนนี้ และยังไม่เคยถูกคืนเงิน — ส่งซ้ำ (หรือ webhook สร้างไปแล้ว) ได้คำสั่งซื้อเดิมพร้อม `alreadyCreated: true` · ยอดไม่ตรง/ของหมด/ตะกร้าว่าง ได้ `409` และคืนเงินอัตโนมัติ |
| GET | `/user/order` | 👤 | `{ ok, orders }` — ยังไม่มีคำสั่งซื้อได้ `orders: []` |
| POST | `/user/order/:id/cancel` | 👤 | ยกเลิกคำสั่งซื้อของตัวเอง (เฉพาะ `Not Process`) → คืนสต็อก + คืนเงินผ่าน Stripe, `status` = `refunded` — สถานะอื่นได้ `400`, ไม่ใช่ของตัวเองได้ `404`, Stripe ไม่ผ่านได้ `502` (ไม่ยกเลิก) |

### แจ้งเตือน (ลูกค้า)

| Method | Endpoint | สิทธิ์ | Body / หมายเหตุ |
|---|---|---|---|
| GET | `/user/notifications` | 👤 | `{ notifications, unread }` — 20 รายการล่าสุด, `type`: `order_status` · `restock` |
| POST | `/user/notifications/read` | 👤 | `{ "id": 3 }` อ่านรายการเดียว — ไม่ส่ง `id` = อ่านทั้งหมด |
| GET | `/user/restock-alert/:productId` | 👤 | `{ subscribed }` |
| POST | `/user/restock-alert/:productId` | 👤 | `{ "subscribe": true }` รอสินค้ามีของ (เฉพาะสินค้าที่หมด ไม่งั้น `400`) · `false` = ยกเลิก |

### รายการโปรด (ลูกค้า)

| Method | Endpoint | สิทธิ์ | Body / หมายเหตุ |
|---|---|---|---|
| GET | `/user/wishlist` | 👤 | สินค้าที่กดหัวใจไว้ (ล่าสุดก่อน) พร้อม `category` และ `images` |
| POST | `/user/wishlist/:productId` | 👤 | `{ "liked": true }` กดหัวใจ · `false` = เอาออก — สินค้าไม่มีได้ `404` |

แจ้งเตือนถูกสร้างอัตโนมัติเมื่อ admin เปลี่ยนสถานะคำสั่งซื้อ (`PUT /admin/order-status`) และเมื่อแก้สินค้าที่หมดให้มีสต็อก (`PUT /product/:id`)

### แบนเนอร์หน้าแรก

| Method | Endpoint | สิทธิ์ | Body / หมายเหตุ |
|---|---|---|---|
| GET | `/banners` | 🌐 | แบนเนอร์ที่เปิดใช้งาน พร้อม `product` (id, title, price, quantity) |
| GET | `/admin/banners` | 🛡️ | ทั้งหมด |
| POST | `/admin/banners` | 🛡️ | `{ "title", "subtitle", "productId", "image": { "secure_url", "public_id" } }` — อัปรูปผ่าน `POST /images` ก่อน |
| PUT | `/admin/banners/:id` | 🛡️ | ส่งเฉพาะช่องที่แก้ เช่น `{ "isActive": false }` — ส่ง `image` ใหม่ = ลบรูปเก่าบน Cloudinary |
| DELETE | `/admin/banners/:id` | 🛡️ | ลบแบนเนอร์ + รูปบน Cloudinary |

### เก็บคูปอง (ลูกค้า)

| Method | Endpoint | สิทธิ์ | หมายเหตุ |
|---|---|---|---|
| GET | `/coupons` | 🌐 | คูปองที่กำลังแจก (เปิดใช้งาน + `isPublic` + ยังไม่หมดอายุ/ไม่ครบจำนวน) |
| GET | `/user/coupons/center` | 👤 | เหมือนด้านบน + `collected` |
| POST | `/user/coupons/:id/collect` | 👤 | เก็บเข้ากระเป๋า (เก็บซ้ำได้ไม่เกิดผล) — โค้ดลับ/หมดแล้วได้ `400` |
| GET | `/user/coupons?subtotal=11800` | 👤 | คูปองที่เก็บไว้ + `status` (`ready`/`unusable`), `usable`, `discount`, `reason` สำหรับยอดนั้น |

### คูปองส่วนลด (admin)

| Method | Endpoint | สิทธิ์ | Body / หมายเหตุ |
|---|---|---|---|
| GET | `/admin/coupons` | 🛡️ | ทั้งหมด พร้อม `used` (ครั้งที่ใช้) และ `totalDiscount` |
| POST | `/admin/coupons` | 🛡️ | `{ "code" (A-Z 0-9 . - _), "description", "type": "percent"\|"fixed", "value", "minOrder", "maxDiscount", "usageLimit", "perUserLimit", "startsAt", "expiresAt", "isPublic" }` — ช่องที่เว้นว่าง = ไม่จำกัด |
| PUT | `/admin/coupons/:id` | 🛡️ | ส่งเฉพาะช่องที่แก้ เช่น `{ "isActive": false }` |
| DELETE | `/admin/coupons/:id` | 🛡️ | ลบ (คำสั่งซื้อเดิมยังเก็บโค้ดไว้) |

### Stripe webhook

| Method | Endpoint | สิทธิ์ | หมายเหตุ |
|---|---|---|---|
| POST | `/stripe/webhook` | Stripe เท่านั้น (ตรวจลายเซ็นด้วย `STRIPE_WEBHOOK_SECRET`) | รับ `payment_intent.succeeded` แล้วสร้างคำสั่งซื้อให้ กรณีลูกค้าปิดหน้าเว็บก่อนบันทึก — ลายเซ็นผิด `400`, ไม่ได้ตั้ง secret `503`, event อื่นตอบ `200` เฉย ๆ |

### ผู้ดูแลระบบ

| Method | Endpoint | สิทธิ์ | Body |
|---|---|---|---|
| GET | `/admin/orders` | 🛡️ | คำสั่งซื้อทั้งหมด พร้อมลูกค้าและรายการสินค้า |
| GET | `/admin/low-stock` | 🛡️ | สินค้าที่คงเหลือ ≤ `lowStockThreshold` ของตัวเอง เรียงจากน้อยไปมาก + `waiting` (จำนวนลูกค้าที่รอของ) |
| PUT | `/admin/order-status` | 🛡️ | `{ "orderId": 1, "orderStatus": "Completed" }` — `Not Process` · `Processing` · `Completed` · `Cancelled` |
| GET | `/users` | 🛡️ | — |
| POST | `/change-status` | 🛡️ | `{ "id": 1, "enabled": false }` |
| POST | `/change-role` | 🛡️ | `{ "id": 1, "role": "admin" }` — `user` · `admin` |

## รูปแบบ error

```json
{ "message": "ข้อความอธิบาย" }
```

| Status | ความหมาย |
|---|---|
| `400` | ข้อมูลไม่ถูกต้อง (เช่น สินค้าหมด, การชำระเงินไม่ผ่าน) |
| `401` | ไม่ได้ login หรือ token หมดอายุ |
| `403` | ไม่มีสิทธิ์ / บัญชีถูกระงับ / Origin ไม่ได้รับอนุญาต |
| `404` | ไม่พบข้อมูล |
| `409` | ชำระเงินแล้วแต่สร้างคำสั่งซื้อไม่ได้ (ของหมด, ยอดไม่ตรง, ตะกร้าว่าง) → คืนเงินอัตโนมัติ / การชำระนี้ถูกคืนเงินไปแล้ว |
| `413` | ข้อมูลที่ส่งใหญ่เกิน (1mb, อัปโหลดรูป 8mb) |
| `429` | เข้าสู่ระบบผิดบ่อยเกินไป รอตามเวลาใน header `Retry-After` |
| `500` | ข้อผิดพลาดฝั่ง server |
