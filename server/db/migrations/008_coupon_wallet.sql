-- ศูนย์เก็บคูปอง: คูปองที่แสดงให้ลูกค้ากดเก็บ + กระเป๋าคูปองของลูกค้า
--   mysql -u root -p ecom < db/migrations/008_coupon_wallet.sql
ALTER TABLE `coupon` ADD COLUMN `isPublic` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'แสดงในหน้าเก็บคูปอง (0 = ใช้ได้เฉพาะคนที่รู้โค้ด)' AFTER `isActive`;

CREATE TABLE IF NOT EXISTS `usercoupon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `couponId` int NOT NULL,
  `collectedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserCoupon_user_coupon_key` (`userId`, `couponId`),
  KEY `UserCoupon_couponId_idx` (`couponId`),
  CONSTRAINT `UserCoupon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UserCoupon_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupon` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
