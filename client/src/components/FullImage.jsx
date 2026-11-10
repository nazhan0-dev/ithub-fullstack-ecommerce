import { cn } from "@/lib/utils";

// แสดงรูปเต็มทั้งรูป (ไม่ถูกตัด) — ช่องว่างรอบรูปเติมด้วยรูปเดียวกันแบบเบลอ
const FullImage = ({ src, alt = "", className, imgClassName, loading }) => (
  <div className={cn("relative h-full w-full overflow-hidden bg-muted", className)}>
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading={loading}
      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
    />
    <img src={src} alt={alt} loading={loading} className={cn("relative h-full w-full object-contain", imgClassName)} />
  </div>
);

export default FullImage;
