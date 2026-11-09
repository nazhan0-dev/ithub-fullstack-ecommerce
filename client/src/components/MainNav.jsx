import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import useEcomStore from "../store/ecom-store";
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
    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
  const navigate = useNavigate();

  const cartCount = carts.reduce((sum, item) => sum + item.count, 0);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="shrink-0" aria-label="IT Hub หน้าแรก">
          <img src={logo} alt="IT Hub" className="h-10 w-auto" />
        </Link>

        <SearchBox className="hidden max-w-md flex-1 md:block" />

        <nav className="ml-auto flex items-center gap-1">
          <NavLink to="/shop" className={navItemClass}>
            <Store size={18} />
            <span className="hidden lg:inline">ร้านค้า</span>
          </NavLink>

          <NavLink to="/about" className={navItemClass}>
            <Info size={18} />
            <span className="hidden lg:inline">เกี่ยวกับเรา</span>
          </NavLink>

          {user && (
            <NavLink to="/user/history" className={navItemClass}>
              <Package size={18} />
              <span className="hidden lg:inline">คำสั่งซื้อ</span>
            </NavLink>
          )}

          <NavLink to="/cart" className={navItemClass}>
            <span className="relative">
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="hidden lg:inline">ตะกร้า</span>
          </NavLink>

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
};

export default MainNav;
