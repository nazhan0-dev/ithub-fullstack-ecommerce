-- คูปองส่วนลด
--   mysql -u root -p ecom < db/migrations/007_coupon.sql
CREATE TABLE IF NOT EXISTS `coupon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'percent = ลดเป็น %, fixed = ลดเป็นบาท',
  `value` double NOT NULL,
  `minOrder` double NOT NULL DEFAULT '0' COMMENT 'ยอดสั่งซื้อขั้นต่ำ (บาท)',
  `maxDiscount` double DEFAULT NULL COMMENT 'ลดสูงสุด (บาท) ใช้กับแบบ %',
  `usageLimit` int DEFAULT NULL COMMENT 'ใช้ได้ทั้งหมดกี่ครั้ง (NULL = ไม่จำกัด)',
  `perUserLimit` int DEFAULT '1' COMMENT 'ต่อคนใช้ได้กี่ครั้ง (NULL = ไม่จำกัด)',
  `startsAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Coupon_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- คูปองที่ผู้ใช้ใส่ไว้กับตะกร้า
ALTER TABLE `cart`
  ADD COLUMN `couponId` int DEFAULT NULL,
  ADD CONSTRAINT `Cart_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- คำสั่งซื้อเก็บโค้ดและส่วนลดที่ใช้ (cartTotal = ยอดที่จ่ายจริงหลังหักส่วนลด)
ALTER TABLE `order`
  ADD COLUMN `couponCode` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `cartTotal`,
  ADD COLUMN `discount` double NOT NULL DEFAULT '0' AFTER `couponCode`,
  ADD KEY `Order_couponCode_idx` (`couponCode`);
