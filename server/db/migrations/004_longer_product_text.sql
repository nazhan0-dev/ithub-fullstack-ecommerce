-- ขยายช่องข้อความสินค้า (เดิม varchar(191) ใส่รายละเอียดสเปกยาว ๆ ไม่ได้)
--   mysql -u root -p ecom < db/migrations/004_longer_product_text.sql
ALTER TABLE `product`
  MODIFY `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY `description` text COLLATE utf8mb4_unicode_ci NOT NULL;
