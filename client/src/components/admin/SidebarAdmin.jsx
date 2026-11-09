import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Store, X } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import logo from "../../assets/logo.png";
import { ADMIN_MENU } from "./adminMenu";
import { cn } from "@/lib/utils";

const linkClass = ({ isActive }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
  );

const SidebarAdmin = ({ open, onClose, pending = 0 }) => {
  const logout = useEcomStore((state) => state.logout);
  const user = useEcomStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* ฉากหลังบนมือถือ */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logo} alt="IT Hub" className="h-9 w-auto" />
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-secondary-foreground">
              Admin
            </span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground lg:hidden" aria-label="ปิดเมนู">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {ADMIN_MENU.map((g) => (
            <div key={g.group}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {g.group}
              </p>
              <div className="space-y-1">
                {g.items.map(({ to, label, icon: Icon, end, badge }) => (
                  <NavLink key={to} to={to} end={end} className={linkClass} onClick={onClose}>
                    {({ isActive }) => (
                      <>
                        <Icon size={18} />
                        <span className="flex-1">{label}</span>
                        {badge === "pending" && pending > 0 && (
                          <span
                            className={cn(
                              "min-w-5 rounded-full px-1.5 text-center text-xs font-bold",
                              isActive ? "bg-white/25 text-white" : "bg-primary text-primary-foreground",
                            )}
                          >
                            {pending}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold uppercase text-primary-foreground">
              {user?.email?.[0] || "A"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">ผู้ดูแลระบบ</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <Store size={18} /> ไปหน้าร้านค้า
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
