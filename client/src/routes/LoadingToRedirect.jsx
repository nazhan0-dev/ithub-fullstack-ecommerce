import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const LoadingToRedirect = () => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (count <= 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert size={28} />
        </span>
        <h1 className="text-lg font-bold">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กำลังพากลับหน้าแรกใน {count} วินาที...
        </p>
      </div>
    </div>
  );
};

export default LoadingToRedirect;
