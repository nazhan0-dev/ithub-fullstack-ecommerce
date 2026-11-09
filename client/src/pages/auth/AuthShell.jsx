// ส่วนหัว/ท้ายของฟอร์ม Login / Register (กรอบและแผงสีม่วงอยู่ใน layouts/AuthLayout.jsx)
const AuthShell = ({ title, subtitle, children, footer }) => (
  <div>
    <div className="mb-6 space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
    {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
  </div>
);

export default AuthShell;
