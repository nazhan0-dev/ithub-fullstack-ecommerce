import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, ClipboardList, ExternalLink, ImageOff, Menu } from "lucide-react";
import { pageTitle } from "./adminMenu";
import { stockThreshold } from "../../utils/product";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// กระดิ่งแจ้งเตือน admin: คำสั่งซื้อรอดำเนินการ + สินค้าใกล้หมด (ตามเกณฑ์ของแต่ละสินค้า)
const AdminBell = ({ pending, lowStock }) => {
  const navigate = useNavigate();
  const total = pending + lowStock.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`การแจ้งเตือน ${total} รายการ`}
        >
          <Bell size={20} />
          {total > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b px-4 py-3 font-semibold">การแจ้งเตือน</div>
        <div className="max-h-[28rem] overflow-y-auto p-1">
          {pending > 0 && (
            <DropdownMenuItem
              onClick={() => navigate("/admin/orders?status=Not Process")}
              className="gap-3 rounded-lg px-3 py-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                <ClipboardList size={16} />
              </span>
              <span className="text-sm">
                คำสั่งซื้อรอดำเนินการ <span className="font-semibold">{pending}</span> รายการ
              </span>
            </DropdownMenuItem>
          )}

          {lowStock.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 pb-1 pt-3 text-xs font-semibold text-muted-foreground">
                <span>สินค้าใกล้หมด ({lowStock.length})</span>
                <button onClick={() => navigate("/admin/product?stock=low")} className="text-primary hover:underline">
                  ดูทั้งหมด
                </button>
              </div>
              {lowStock.slice(0, 8).map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => navigate(`/admin/product/${p.id}`)}
                  className="gap-3 rounded-lg px-3 py-2"
                >
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                    {p.images?.[0] ? (
                      <img src={p.images[0].url} alt="" className="h-full w-full object-contain p-0.5" />
                    ) : (
                      <ImageOff size={14} className="text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      เกณฑ์ ≤ {stockThreshold(p)} ชิ้น
                      {p.waiting > 0 && <> · ลูกค้ารอ {p.waiting} คน</>}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      p.quantity <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {p.quantity <= 0 ? "หมด" : `เหลือ ${p.quantity}`}
                  </span>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {total === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">ไม่มีรายการที่ต้องจัดการ</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const HeaderAdmin = ({ onMenu, pending = 0, lowStock = [] }) => {
  const { pathname } = useLocation();
  const { group, label } = pageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-white px-4 md:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="เปิดเมนู">
        <Menu size={20} />
      </button>

      {/* breadcrumb */}
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden text-muted-foreground sm:inline">หลังร้าน</span>
        {group && (
          <>
            <ChevronRight size={14} className="hidden text-muted-foreground sm:block" />
            <span className="hidden text-muted-foreground sm:inline">{group}</span>
          </>
        )}
        <ChevronRight size={14} className="hidden text-muted-foreground sm:block" />
        <span className="truncate font-semibold">{label}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <AdminBell pending={pending} lowStock={lowStock} />
        <Link
          to="/"
          target="_blank"
          className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:flex"
        >
          ดูหน้าร้าน <ExternalLink size={14} />
        </Link>
      </div>
    </header>
  );
};

export default HeaderAdmin;
