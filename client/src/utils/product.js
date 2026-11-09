// ค่าเริ่มต้นของฟอร์มสินค้า (หน้าเพิ่มและแก้ไข)
export const emptyProduct = {
  title: "",
  description: "",
  price: "",
  quantity: "",
  lowStockThreshold: 5,
  categoryId: "",
  images: [],
};

// เกณฑ์ "ใกล้หมด" ของสินค้า (admin ตั้งได้รายสินค้า, 0 = ไม่แจ้งเตือน)
export const stockThreshold = (p) => Number(p?.lowStockThreshold ?? 5);

// admin: สินค้าที่ควรเติมสต็อก (หมด หรือ คงเหลือ ≤ เกณฑ์)
export const needsRestock = (p) => stockThreshold(p) > 0 && p.quantity <= stockThreshold(p);

// ลูกค้ากดเพิ่มเกินจำนวนที่มี -> แจ้งว่าเหลือเท่าไร (toastId กันข้อความซ้อนกันเมื่อกดรัว ๆ)
export const warnStockLimit = (toast, p) =>
  toast.warn(`สินค้านี้เหลือเพียง ${p.quantity} ชิ้น`, { toastId: `stock-limit-${p.id}` });
