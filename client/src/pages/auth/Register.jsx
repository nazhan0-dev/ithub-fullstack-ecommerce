import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import zxcvbn from "zxcvbn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AuthShell from "./AuthShell";
import { registerUser } from "../../api/auth";

const registerSchema = z
  .object({
    email: z.string().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
    password: z.string().min(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

const strengthLabel = ["อ่อนมาก", "อ่อน", "พอใช้", "ดี", "แข็งแรง"];

const Field = ({ id, label, error, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm font-medium">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const password = useWatch({ control, name: "password" }) || "";
  const score = password ? zxcvbn(password).score : 0;
  const barColor = score <= 1 ? "bg-red-500" : score <= 2 ? "bg-amber-400" : "bg-emerald-500";

  const onSubmit = async (data) => {
    try {
      const res = await registerUser(data);
      toast.success(typeof res.data === "string" ? res.data : "สมัครสมาชิกสำเร็จ");
      navigate("/login");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "สมัครสมาชิกไม่สำเร็จ");
    }
  };

  return (
    <AuthShell
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีใหม่เพื่อเริ่มช้อปปิ้ง"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field id="email" label="อีเมล" error={errors.email}>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
            aria-invalid={!!errors.email} className="h-11" {...register("email")} />
        </Field>

        <Field id="password" label="รหัสผ่าน" error={errors.password}>
          <Input id="password" type="password" placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password"
            aria-invalid={!!errors.password} className="h-11" {...register("password")} />
          {password.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={cn("h-1.5 flex-1 rounded-full bg-muted", i <= score && barColor)} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">ความปลอดภัย: {strengthLabel[score]}</p>
            </div>
          )}
        </Field>

        <Field id="confirmPassword" label="ยืนยันรหัสผ่าน" error={errors.confirmPassword}>
          <Input id="confirmPassword" type="password" placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword} className="h-11" {...register("confirmPassword")} />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-full text-base font-semibold">
          {isSubmitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;
