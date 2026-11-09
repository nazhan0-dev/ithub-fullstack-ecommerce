-- สำหรับฐานข้อมูลที่สร้างจาก schema.sql รุ่นก่อนหน้า (ติดตั้งใหม่ไม่ต้องรัน)
--   mysql -u root -p ecom < db/migrations/001_keep_order_history.sql

-- ลบสินค้าแล้วต้องไม่ลบรายการในคำสั่งซื้อเก่าตามไปด้วย
ALTER TABLE `productonorder` DROP FOREIGN KEY `ProductOnOrder_productId_fkey`;
ALTER TABLE `productonorder` ADD CONSTRAINT `ProductOnOrder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- การชำระเงินหนึ่งครั้งสร้างคำสั่งซื้อได้ครั้งเดียว
ALTER TABLE `order` ADD UNIQUE KEY `Order_stripePayment_key` (`stripePayment`);
