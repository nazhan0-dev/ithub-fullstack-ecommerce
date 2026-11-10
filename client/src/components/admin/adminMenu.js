import { ClipboardList, GalleryHorizontal, LayoutDashboard, PackageSearch, Tags, Users } from "lucide-react";

// เมนูหลังร้าน (ใช้ทั้ง Sidebar และชื่อหน้าใน Header)
export const ADMIN_MENU = [
  {
    group: "ภาพรวม",
    items: [{ to: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, end: true }],
  },
  {
    group: "การขาย",
    items: [{ to: "/admin/orders", label: "คำสั่งซื้อ", icon: ClipboardList, badge: "pending" }],
  },
  {
    group: "แคตตาล็อก",
    items: [
      { to: "/admin/product", label: "สินค้า", icon: PackageSearch },
      { to: "/admin/category", label: "หมวดหมู่", icon: Tags },
      { to: "/admin/banners", label: "แบนเนอร์หน้าแรก", icon: GalleryHorizontal },
    ],
  },
  {
    group: "ลูกค้า",
    items: [{ to: "/admin/manage", label: "ผู้ใช้งาน", icon: Users }],
  },
];

export function pageTitle(pathname) {
  if (/^\/admin\/product\/.+/.test(pathname)) return { group: "แคตตาล็อก", label: "แก้ไขสินค้า" };
  for (const g of ADMIN_MENU) {
    const item = g.items.find((i) => (i.end ? pathname === i.to || pathname === i.to + "/" : pathname.startsWith(i.to)));
    if (item) return { group: g.group, label: item.label };
  }
  return { group: "", label: "ระบบจัดการร้านค้า" };
}
