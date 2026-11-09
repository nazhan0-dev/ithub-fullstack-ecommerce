-- ระบบแจ้งเตือน (สำหรับฐานข้อมูลที่สร้างก่อนหน้านี้ — ติดตั้งใหม่จาก schema.sql ไม่ต้องรัน)
--   mysql -u root -p ecom < db/migrations/003_notifications.sql

-- เกณฑ์ "สินค้าใกล้หมด" ของแต่ละสินค้า (0 = ไม่แจ้งเตือน)
ALTER TABLE `product` ADD COLUMN `lowStockThreshold` int NOT NULL DEFAULT '5' AFTER `quantity`;

-- กล่องแจ้งเตือนของผู้ใช้ (สถานะคำสั่งซื้อเปลี่ยน, สินค้ากลับมามีของ)
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_idx` (`userId`, `isRead`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ผู้ใช้ที่กด "แจ้งเตือนเมื่อมีของ" ไว้ (ส่งแจ้งเตือนแล้วลบออก)
CREATE TABLE IF NOT EXISTS `restockalert` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RestockAlert_user_product_key` (`userId`, `productId`),
  KEY `RestockAlert_productId_idx` (`productId`),
  CONSTRAINT `RestockAlert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RestockAlert_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
