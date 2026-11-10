import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, TicketPercent } from "lucide-react";
import { listAvailableCoupons } from "../../api/coupon";

// แถบชวนเก็บคูปองบนหน้าแรก (แสดงเมื่อมีคูปองแจกอยู่)
const CouponStrip = () => {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    listAvailableCoupons()
      .then((res) => setCoupons(res.data))
      .catch(() => {});
  }, []);

  if (coupons.length === 0) return null;
  const best = coupons.map((c) => (c.type === "percent" ? `${c.value}%` : `฿${c.value.toLocaleString()}`));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/coupons"
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 px-5 py-4 text-white shadow-md shadow-primary/20"
      >
        {/* แสงวิ่งผ่าน */}
        <motion.span
          animate={{ x: ["-30%", "130%"] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          className="absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
        <motion.span
          animate={{ rotate: [0, -12, 12, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
          className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-white/20"
        >
          <TicketPercent size={24} />
        </motion.span>
        <div className="relative min-w-0 flex-1">
          <p className="font-bold">มีคูปองให้เก็บ {coupons.length} ใบ</p>
          <p className="truncate text-sm text-white/85">ส่วนลด {best.slice(0, 3).join(" · ")} — กดเก็บแล้วใช้ตอนชำระเงิน</p>
        </div>
        <span className="relative hidden shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary transition-all group-hover:gap-2 sm:inline-flex">
          เก็บคูปอง <ArrowRight size={16} />
        </span>
        <ArrowRight size={20} className="relative shrink-0 sm:hidden" />
      </Link>
    </motion.div>
  );
};

export default CouponStrip;
