import { useEffect, useState } from "react";
import { Check, ShoppingCart, ImageOff } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { priceFormat } from "../../utils/number";
import { warnStockLimit } from "../../utils/product";
import HeartButton from "../HeartButton";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 300, damping: 22 };

// index: ลำดับการ์ด ใช้หน่วงเวลาให้การ์ดค่อย ๆ โผล่ทีละใบ
const ProductCard = ({ item, className, index = 0 }) => {
  const reduceMotion = useReducedMotion();
  const [added, setAdded] = useState(false); // เพิ่งกดใส่ตะกร้า -> โชว์เครื่องหมายถูกครู่หนึ่ง
  const actionAddtoCart = useEcomStore((state) => state.actionAddtoCart);
  const inCart = useEcomStore((state) => state.carts.find((c) => c.id === item.id)?.count || 0);
  const outOfStock = item.quantity <= 0;
  const isTopItem = item.sold >= 5;

  const handleAdd = () => {
    if (outOfStock) return;
    if (inCart >= item.quantity) return warnStockLimit(toast, item);
    actionAddtoCart(item);
    setAdded(true);
    toast.success("เพิ่มลงตะกร้าแล้ว");
  };

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <motion.div
      // โผล่ขึ้นมาเมื่อเลื่อนมาถึง (ทีละใบ) + ลอยขึ้นเล็กน้อยตอนชี้
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { ...spring, delay: reduceMotion ? 0 : (index % 8) * 0.05 },
      }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={spring}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20",
        className,
      )}
    >
      {/* รูปสินค้า */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/60">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0].url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff size={32} />
            <span className="text-xs">ไม่มีรูปภาพ</span>
          </div>
        )}

        <HeartButton productId={item.id} className="absolute right-2 top-2 size-8" size={16} />

        {isTopItem && !outOfStock && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-3 py-0.5 text-xs font-semibold text-amber-950 shadow-sm">
            ขายดี
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-semibold text-muted-foreground">
            สินค้าหมด
          </span>
        )}
      </div>

      {/* ข้อมูลสินค้า */}
      <div className="flex flex-1 flex-col items-center px-1 pt-3 text-center">
        {/* ลิงก์คลุมทั้งการ์ด: กดตรงไหนก็ไปหน้ารายละเอียด ยกเว้นปุ่มใส่ตะกร้า */}
        <Link
          to={`/product/${item.id}`}
          title={item.title}
          className="line-clamp-2 min-h-[2.75em] w-full font-semibold leading-snug after:absolute after:inset-0 after:rounded-2xl hover:text-primary"
        >
          {item.title}
        </Link>
        <p className="w-full truncate text-xs text-muted-foreground">
          {item.category?.name || item.description}
        </p>

        <div className="mt-auto pt-3">
          <motion.button
            onClick={handleAdd}
            disabled={outOfStock}
            whileTap={outOfStock ? undefined : { scale: 0.9 }}
            aria-label={`เพิ่ม ${item.title} ลงตะกร้า`}
            className={cn(
              "relative z-10 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent",
              added
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {/* ไอคอนตะกร้า -> เครื่องหมายถูก หลังกดเพิ่ม */}
            <span className="relative grid size-[15px] place-items-center">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={added ? "check" : "cart"}
                  initial={{ scale: 0, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 90, opacity: 0 }}
                  transition={spring}
                  className="grid place-items-center"
                >
                  {added ? <Check size={15} strokeWidth={3} /> : <ShoppingCart size={15} />}
                </motion.span>
              </AnimatePresence>
            </span>
            {priceFormat(item.price)}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
