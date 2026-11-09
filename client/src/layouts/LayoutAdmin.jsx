import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SidebarAdmin from "../components/admin/SidebarAdmin";
import HeaderAdmin from "../components/admin/HeaderAdmin";
import { getLowStock, getOrdersAdmin } from "../api/admin";
import { BACKGROUND } from "../api/client";

const LayoutAdmin = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const [lowStock, setLowStock] = useState([]);

  // คำสั่งซื้อรอดำเนินการ + สินค้าใกล้หมด (อัปเดตทุกครั้งที่เปลี่ยนหน้า และทุก 1 นาที)
  useEffect(() => {
    const load = () => {
      getOrdersAdmin(BACKGROUND)
        .then((res) => setPending((res.data || []).filter((o) => o.orderStatus === "Not Process").length))
        .catch(() => {});
      getLowStock(BACKGROUND)
        .then((res) => setLowStock(res.data || []))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-background">
      <SidebarAdmin open={open} onClose={() => setOpen(false)} pending={pending} />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderAdmin onMenu={() => setOpen(true)} pending={pending} lowStock={lowStock} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
