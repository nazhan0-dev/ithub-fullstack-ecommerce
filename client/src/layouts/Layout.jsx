import { Link, Outlet, ScrollRestoration } from "react-router-dom";
import MainNav from "../components/MainNav";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* เปลี่ยนหน้าแล้วเลื่อนขึ้นบนสุด (กดย้อนกลับจะกลับไปตำแหน่งเดิม) */}
      <ScrollRestoration />
      <MainNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 text-center md:pb-6 text-sm text-muted-foreground">
        <nav className="mb-2 hidden justify-center gap-5 md:flex">
          <Link to="/" className="hover:text-primary">หน้าแรก</Link>
          <Link to="/shop" className="hover:text-primary">ร้านค้า</Link>
          <Link to="/about" className="hover:text-primary">เกี่ยวกับเรา</Link>
        </nav>
        © {new Date().getFullYear()} IT Hub — ร้านค้าอุปกรณ์ไอที
      </footer>
    </div>
  );
};

export default Layout;
