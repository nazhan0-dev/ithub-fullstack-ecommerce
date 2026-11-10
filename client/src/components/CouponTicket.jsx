import { motion } from "motion/react";
import { priceFormat } from "../utils/number";
import { dateFormat } from "../utils/dateformat";
import { cn } from "@/lib/utils";

// ตั๋วคูปอง (ใช้ในหน้าเก็บคูปอง / คูปองของฉัน / หน้าชำระเงิน)
// action: ปุ่มด้านขวา, note: ข้อความเล็กใต้เงื่อนไข (เช่น เหตุผลที่ใช้ไม่ได้), compact: แบบเล็กในหน้าชำระเงิน
const CouponTicket = ({ coupon, action, note, dimmed, highlight, compact, className, index = 0 }) => {
  const big = coupon.type === "percent" ? `${coupon.value}%` : `฿${Number(coupon.value).toLocaleString()}`;
  const conditions = [
    coupon.minOrder > 0 ? `ขั้นต่ำ ${priceFormat(coupon.minOrder)}` : "ไม่มีขั้นต่ำ",
    coupon.maxDiscount ? `ลดสูงสุด ${priceFormat(coupon.maxDiscount)}` : null,
  ].filter(Boolean);
  const notStarted = coupon.startsAt && new Date(coupon.startsAt) > new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26, delay: Math.min(index, 8) * 0.05 } }}
      className={cn(
        "relative flex overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow",
        highlight && "ring-2 ring-emerald-400",
        dimmed && "opacity-60 grayscale-[40%]",
        className,
      )}
    >
      {/* ฝั่งมูลค่า */}
      <div
        className={cn(
          "relative flex shrink-0 flex-col items-center justify-center bg-gradient-to-br from-primary to-fuchsia-500 text-white",
          compact ? "w-20 p-2" : "w-28 p-3",
        )}
      >
        <span className={cn("font-extrabold leading-none", compact ? "text-xl" : "text-3xl")}>{big}</span>
        <span className="mt-1 text-[11px] text-white/85">ส่วนลด</span>
        {/* รอยฉีกแบบตั๋ว */}
        <span className={cn("absolute -right-2 -top-2 size-4 rounded-full", compact ? "bg-white" : "bg-background")} />
        <span className={cn("absolute -bottom-2 -right-2 size-4 rounded-full", compact ? "bg-white" : "bg-background")} />
      </div>
      <span className="w-0 border-l-2 border-dashed border-primary/20" />

      {/* รายละเอียด */}
      <div className={cn("flex min-w-0 flex-1 items-center gap-3", compact ? "p-2.5 pl-3" : "p-4")}>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className={cn("font-semibold leading-snug", compact ? "line-clamp-2 text-sm" : "truncate text-base")}>
            {coupon.description}
          </p>
          <p className="truncate text-xs text-muted-foreground">{conditions.join(" · ")}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            <span className="font-mono font-semibold text-foreground/70">{coupon.code}</span>
            {notStarted
              ? ` · เริ่ม ${dateFormat(coupon.startsAt)}`
              : coupon.expiresAt
                ? ` · ใช้ได้ถึง ${dateFormat(coupon.expiresAt)}`
                : ""}
          </p>
          {note && <p className="truncate text-[11px] font-medium text-amber-600">{note}</p>}
        </div>
        {action}
      </div>
    </motion.div>
  );
};

export default CouponTicket;
