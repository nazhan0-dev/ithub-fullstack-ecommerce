import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

// โครงหน้าร่วมของ Login / Register
const AuthShell = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
    <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-white/10" />
        <Link to="/" className="relative w-fit rounded-2xl bg-white px-4 py-2 shadow-sm">
          <img src={logo} alt="IT Hub" className="h-10 w-auto" />
        </Link>
        <div className="relative space-y-2">
          <h2 className="text-3xl font-extrabold leading-tight">ช้อปอุปกรณ์ไอทีที่ใช่ ในราคาที่ชอบ</h2>
          <p className="text-white/80">สมัครสมาชิกเพื่อติดตามคำสั่งซื้อและรับโปรโมชันพิเศษ</p>
        </div>
      </div>

      <div className="p-8 sm:p-10">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  </div>
);

export default AuthShell;
