import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthShell from "./AuthShell";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const actionLogin = useEcomStore((state) => state.actionLogin);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await actionLogin(form);
      const role = res.data.payload.role;
      toast.success("ยินดีต้อนรับกลับมา!");
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate(location.state?.from || "/", { replace: true });
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับมา กรุณากรอกข้อมูลของคุณ"
      footer={
        <>
          ยังไม่มีบัญชี?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
          <Input id="email" name="email" type="email" required autoComplete="email"
            placeholder="you@example.com" className="h-11" onChange={handleChange} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
          <Input id="password" name="password" type="password" required autoComplete="current-password"
            placeholder="••••••••" className="h-11" onChange={handleChange} />
        </div>
        <Button type="submit" disabled={loading} className="h-11 w-full rounded-full text-base font-semibold">
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
