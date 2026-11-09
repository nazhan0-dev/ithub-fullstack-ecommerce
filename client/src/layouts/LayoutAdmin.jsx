import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SidebarAdmin from "../components/admin/SidebarAdmin";
import HeaderAdmin from "../components/admin/HeaderAdmin";
import useEcomStore from "../store/ecom-store";
import { getOrdersAdmin } from "../api/admin";

const LayoutAdmin = () => {
  const token = useEcomStore((state) => state.token);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  // จำนวนคำสั่งซื้อที่รอดำเนินการ (อัปเดตทุกครั้งที่เปลี่ยนหน้า)
  useEffect(() => {
    getOrdersAdmin(token)
      .then((res) => setPending((res.data || []).filter((o) => o.orderStatus === "Not Process").length))
      .catch(() => {});
  }, [token, pathname]);

  return (
    <div className="flex h-screen bg-background">
      <SidebarAdmin open={open} onClose={() => setOpen(false)} pending={pending} />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderAdmin onMenu={() => setOpen(true)} pending={pending} />
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
