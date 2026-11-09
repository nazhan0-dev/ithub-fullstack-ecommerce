import { ShoppingCart, ImageOff } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { priceFormat } from "../../utils/number";
import { cn } from "@/lib/utils";

const ProductCard = ({ item, className }) => {
  const actionAddtoCart = useEcomStore((state) => state.actionAddtoCart);
  const outOfStock = item.quantity <= 0;
  const isTopItem = item.sold >= 5;

  const handleAdd = () => {
    if (outOfStock) return;
    actionAddtoCart(item);
    toast.success(`เพิ่ม ${item.title} ลงตะกร้าแล้ว`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group relative flex h-full flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-lg",
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
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff size={32} />
            <span className="text-xs">ไม่มีรูปภาพ</span>
          </div>
        )}

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
          className="block w-full truncate font-semibold after:absolute after:inset-0 after:rounded-2xl hover:text-primary"
        >
          {item.title}
        </Link>
        <p className="w-full truncate text-xs text-muted-foreground">
          {item.category?.name || item.description}
        </p>

        <div className="mt-auto pt-3">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`เพิ่ม ${item.title} ลงตะกร้า`}
            className="relative z-10 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
          >
            <ShoppingCart size={15} />
            {priceFormat(item.price)}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
