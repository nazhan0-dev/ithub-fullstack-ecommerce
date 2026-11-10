-- แบนเนอร์หน้าแรก (admin ตั้งเอง)
--   mysql -u root -p ecom < db/migrations/006_banner.sql
CREATE TABLE IF NOT EXISTS `banner` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imageUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publicId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` int DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Banner_productId_idx` (`productId`),
  CONSTRAINT `Banner_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
