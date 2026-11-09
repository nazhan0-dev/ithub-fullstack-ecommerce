-- สำหรับฐานข้อมูลที่สร้างจาก schema.sql รุ่นก่อนหน้า (ติดตั้งใหม่ไม่ต้องรัน)
--   mysql -u root -p ecom < db/migrations/002_fix_column_names.sql

-- แก้ชื่อคอลัมน์ที่สะกดผิด
ALTER TABLE `order` RENAME COLUMN `currentcy` TO `currency`;
ALTER TABLE `user` RENAME COLUMN `picturce` TO `picture`;

-- order.amount เปลี่ยนจากบาท (ปัดเศษ) เป็นสตางค์ ตรงกับที่ Stripe ตัดจริง
ALTER TABLE `order` MODIFY `amount` int NOT NULL COMMENT 'ยอดที่ Stripe ตัดจริง หน่วยสตางค์';
UPDATE `order` SET `amount` = `amount` * 100;
