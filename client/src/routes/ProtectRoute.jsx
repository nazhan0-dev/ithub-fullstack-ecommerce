import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useEcomStore from "../store/ecom-store";
import { currentAdmin, currentUser } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

// ตรวจสิทธิ์ก่อนเข้าหน้า: role = "user" | "admin"
const ProtectRoute = ({ element, role = "user" }) => {
  const user = useEcomStore((state) => state.user);
  const token = useEcomStore((state) => state.token);
  const location = useLocation();
  const [status, setStatus] = useState("checking"); // checking | ok | denied

  useEffect(() => {
    if (!user || !token) return;
    const check = role === "admin" ? currentAdmin : currentUser;
    check(token)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("denied"));
  }, [user, token, role]);

  // ยังไม่ได้ login -> ไปหน้า login แล้วกลับมาที่เดิมหลัง login
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return status === "ok" ? element : <LoadingToRedirect />;
};

export default ProtectRoute;
