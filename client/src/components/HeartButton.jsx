import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useEcomStore from "../store/ecom-store";
import { cn } from "@/lib/utils";

// ปุ่มหัวใจ (รายการโปรด) — ใช้บนการ์ดสินค้าและหน้ารายละเอียด
const HeartButton = ({ productId, className, size = 18 }) => {
  const navigate = useNavigate();
  const user = useEcomStore((s) => s.user);
  const liked = useEcomStore((s) => s.wishlist.includes(productId));
  const toggleWishlist = useEcomStore((s) => s.toggleWishlist);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("เข้าสู่ระบบก่อน เพื่อบันทึกรายการโปรด", { toastId: "wishlist-login" });
      navigate("/login");
      return;
    }
    try {
      const nowLiked = await toggleWishlist(productId);
      toast.success(nowLiked ? "เพิ่มในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว", {
        toastId: `wishlist-${productId}`,
      });
    } catch {
      toast.error("บันทึกรายการโปรดไม่สำเร็จ");
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.8 }}
      aria-label={liked ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      aria-pressed={liked}
      className={cn(
        "relative z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white",
        liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
        className,
      )}
    >
      {/* key เปลี่ยน -> หัวใจเด้งทุกครั้งที่กด (ไม่เด้งตอนโหลดหน้า) */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={liked ? "on" : "off"}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
          className="grid place-items-center"
        >
          <Heart size={size} fill={liked ? "currentColor" : "none"} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default HeartButton;
