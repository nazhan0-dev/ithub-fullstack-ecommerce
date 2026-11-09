import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, BellRing, Package } from "lucide-react";
import { getNotifications, readNotifications } from "../api/user";
import { BACKGROUND } from "../api/client";
import { timeAgo } from "../utils/dateformat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

const ICONS = { order_status: Package, restock: BellRing };

// กระดิ่งแจ้งเตือนของลูกค้า (สถานะคำสั่งซื้อเปลี่ยน / สินค้ากลับมามีของ)
// variant="tab": แสดงเป็นปุ่มในแถบเมนูด้านล่าง (มือถือ)
const NotificationBell = ({ variant = "top" }) => {
  const isTab = variant === "tab";
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    getNotifications(BACKGROUND)
      .then((res) => {
        setItems(res.data.notifications || []);
        setUnread(res.data.unread || 0);
      })
      .catch(() => {});
  }, []);

  // โหลดตอนเปลี่ยนหน้า + เช็กใหม่ทุก 1 นาที
  useEffect(() => {
    load();
  }, [load, pathname]);
  useEffect(() => {
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const open = async (n) => {
    if (!n.isRead) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      readNotifications(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const readAll = (e) => {
    e.preventDefault();
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    readNotifications().catch(() => {});
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={
            isTab
              ? "relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-muted-foreground"
              : "relative flex items-center rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          }
          aria-label={`การแจ้งเตือน ${unread} รายการที่ยังไม่อ่าน`}
        >
          <span className="relative">
            <Bell size={isTab ? 20 : 18} />
            {unread > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </span>
          {isTab && "แจ้งเตือน"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={isTab ? "top" : "bottom"} className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">การแจ้งเตือน</span>
          {unread > 0 && (
            <button onClick={readAll} className="text-xs font-semibold text-primary hover:underline">
              อ่านทั้งหมด
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => open(n)}
                  className={cn("items-start gap-3 rounded-lg px-3 py-2.5", !n.isRead && "bg-primary/5")}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">{n.message}</span>
                    <span className="block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
