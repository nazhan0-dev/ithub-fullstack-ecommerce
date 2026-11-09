import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronRight, ExternalLink, Menu } from "lucide-react";
import { pageTitle } from "./adminMenu";

const HeaderAdmin = ({ onMenu, pending = 0 }) => {
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
        <Link
          to="/admin/orders?status=Not Process"
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`คำสั่งซื้อรอดำเนินการ ${pending} รายการ`}
          title={`คำสั่งซื้อรอดำเนินการ ${pending} รายการ`}
        >
          <Bell size={20} />
          {pending > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {pending}
            </span>
          )}
        </Link>
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
