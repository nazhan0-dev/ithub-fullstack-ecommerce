import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Store,
  Package,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  User,
  Info,
  Heart,
  TicketPercent,
} from "lucide-react";
import { motion } from "motion/react";
import useEcomStore from "../store/ecom-store";
import useMediaQuery from "../hooks/useMediaQuery";
import { listAvailableCoupons, listCouponCenter } from "../api/coupon";
import { BACKGROUND } from "../api/client";
import NotificationBell from "./NotificationBell";
import logo from "../assets/logo.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItemClass = ({ isActive }) =>
  cn(
    "flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
    isActive
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

const CountBadge = ({ value, className }) => (
  <span
    className={cn(
      "absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white",
      className,
    )}
  >
    {value > 99 ? "99+" : value}
  </span>
);

// แถบเมนูด้านล่าง (มือถือ / จอเล็ก) — พื้นสีอ่อนเลื่อนตามเมนูที่เลือก
const BottomNav = ({ items, user }) => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    aria-label="เมนูหลัก"
  >
    <div className="mx-auto flex max-w-md items-stretch px-2 py-1">
      {items.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-x-1 inset-y-0 rounded-xl bg-secondary"
                />
              )}
              <span className="relative">
                <Icon size={20} />
                {badge > 0 && <CountBadge value={badge} />}
              </span>
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
      {user && <NotificationBell variant="tab" />}
    </div>
  </nav>
);

const SearchBox = ({ className }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [text, setText] = useState(q);
  const [prevQ, setPrevQ] = useState(q);

  // sync ช่องค้นหาเมื่อ ?q= ใน URL เปลี่ยน
  if (q !== prevQ) {
    setPrevQ(q);
    setText(q);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = text.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        type="search"
        placeholder="ค้นหาสินค้า..."
        className="h-11 w-full rounded-full bg-muted pl-11 pr-4 text-sm outline-none ring-primary/30 transition focus:bg-white focus:ring-2"
      />
    </form>
  );
};

const MainNav = () => {
  const carts = useEcomStore((state) => state.carts);
  const user = useEcomStore((state) => state.user);
  const logout = useEcomStore((state) => state.logout);
  const loadWishlist = useEcomStore((state) => state.loadWishlist);
  const wishCount = useEcomStore((state) => state.wishlist.length);

  // login แล้ว -> โหลดรายการโปรดจาก server (หัวใจบนการ์ดจะแดงตามที่เคยกดไว้)
  const userId = user?.id;
  useEffect(() => {
    if (userId) loadWishlist();
  }, [userId, loadWishlist]);
  const navigate = useNavigate();

  const cartCount = carts.reduce((sum, item) => sum + item.count, 0);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // จำนวนคูปองที่ยังเก็บได้ (login แล้ว = ที่ยังไม่ได้เก็บ) — โหลดใหม่ทุกครั้งที่เปลี่ยนหน้า
  const { pathname } = useLocation();
  const [couponCount, setCouponCount] = useState(0);
  useEffect(() => {
    (userId ? listCouponCenter(BACKGROUND) : listAvailableCoupons())
      .then((res) => setCouponCount(res.data.filter((c) => !c.collected).length))
      .catch(() => {});
  }, [userId, pathname]);

  const couponLink = (
    <NavLink to="/coupons" className={navItemClass} aria-label={`เก็บคูปอง ${couponCount} ใบ`}>
      <span className="relative">
        <TicketPercent size={18} />
        {couponCount > 0 && <CountBadge value={couponCount} className="bg-rose-500" />}
      </span>
      <span className="hidden lg:inline">คูปอง</span>
    </NavLink>
  );

  const items = [
    { to: "/shop", icon: Store, label: "ร้านค้า" },
    { to: "/about", icon: Info, label: "เกี่ยวกับเรา" },
    ...(user ? [{ to: "/user/history", icon: Package, label: "คำสั่งซื้อ" }] : []),
    { to: "/cart", icon: ShoppingCart, label: "ตะกร้า", badge: cartCount },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const header = (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <Link to="/" className="shrink-0" aria-label="IT Hub หน้าแรก">
          <img src={logo} alt="IT Hub" className="h-8 w-auto sm:h-10" />
        </Link>

        <SearchBox className="hidden max-w-md flex-1 md:block" />

        <nav className="ml-auto flex items-center gap-1">
          {/* จอใหญ่: เมนูอยู่ด้านบน / จอเล็ก: ย้ายไปแถบด้านล่าง (เหลือแค่โปรไฟล์) */}
          {isDesktop && (
            <>
              {items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink key={to} to={to} className={navItemClass}>
                  <span className="relative">
                    <Icon size={18} />
                    {badge > 0 && <CountBadge value={badge} />}
                  </span>
                  <span className="hidden lg:inline">{label}</span>
                </NavLink>
              ))}
              {couponLink}
              {user && <NotificationBell />}
            </>
          )}
          {/* มือถือ: ปุ่มคูปองอยู่ด้านบนข้างโปรไฟล์ */}
          {!isDesktop && couponLink}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-1 rounded-full p-1 pr-2 transition-colors hover:bg-muted">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-bold uppercase text-secondary-foreground">
                    {user.email?.[0] ?? <User size={16} />}
                  </span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <LayoutDashboard /> หน้าผู้ดูแลระบบ
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/user/history")}>
                  <Package /> ประวัติการสั่งซื้อ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/coupons?tab=mine")}>
                  <TicketPercent /> คูปองของฉัน
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/user/wishlist")}>
                  <Heart /> รายการโปรด
                  {wishCount > 0 && (
                    <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">
                      {wishCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut /> ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-1 flex items-center gap-1">
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button asChild className="hidden rounded-full sm:inline-flex">
                <Link to="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>

      {/* Search บนมือถือ */}
      <div className="px-4 pb-3 md:hidden">
        <SearchBox />
      </div>
    </header>
  );

  return (
    <>
      {header}
      {!isDesktop && <BottomNav items={items} user={user} />}
    </>
  );
};

export default MainNav;
