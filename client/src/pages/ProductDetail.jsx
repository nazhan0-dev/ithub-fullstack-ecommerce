import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImageOff, Loader2, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "react-toastify";
import { readProduct } from "../api/product";
import useEcomStore from "../store/ecom-store";
import { priceFormat } from "../utils/number";
import { cn } from "@/lib/utils";

// หน้ารายละเอียดสินค้า (/product/:id) — กดการ์ดสินค้าแล้วมาหน้านี้
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const carts = useEcomStore((s) => s.carts);
  const actionAddtoCart = useEcomStore((s) => s.actionAddtoCart);
  const actionUpdateQuantity = useEcomStore((s) => s.actionUpdateQuantity);

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setActive(0);
    setQty(1);
    readProduct(id)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.data);
        setStatus("ok");
      })
      .catch(() => !cancelled && setStatus("notfound"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (status === "notfound" || !product) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold">ไม่พบสินค้านี้</p>
        <Link to="/shop" className="font-semibold text-primary hover:underline">
          กลับไปหน้าร้านค้า
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const inCart = carts.find((item) => item.id === product.id)?.count || 0;
  const canAdd = Math.max(0, product.quantity - inCart); // จำนวนที่ยังเพิ่มได้ (ไม่เกินสต็อก)
  const outOfStock = product.quantity <= 0;

  const addToCart = () => {
    if (canAdd <= 0) {
      toast.info("สินค้านี้ในตะกร้าครบจำนวนสต็อกแล้ว");
      return false;
    }
    const amount = Math.min(qty, canAdd);
    if (!inCart) actionAddtoCart(product);
    actionUpdateQuantity(product.id, inCart + amount);
    toast.success(`เพิ่ม ${product.title} ${amount} ชิ้นลงตะกร้าแล้ว`);
    setQty(1);
    return true;
  };

  const buyNow = () => {
    if (inCart >= product.quantity || addToCart()) navigate("/cart");
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/shop"))}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={16} /> ย้อนกลับ
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6 md:grid-cols-2 md:gap-10"
      >
        {/* รูปสินค้า */}
        <div className="min-w-0 space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/60">
            {images.length > 0 ? (
              <motion.img
                key={images[active]?.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[active]?.url}
                alt={product.title}
                className="h-full w-full object-contain p-6"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff size={40} />
                <span className="text-sm">ไม่มีรูปภาพ</span>
              </div>
            )}
            {outOfStock && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-lg font-semibold text-muted-foreground">
                สินค้าหมด
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id ?? img.url}
                  onClick={() => setActive(i)}
                  aria-label={`ดูรูปที่ ${i + 1}`}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-2 transition sm:size-20",
                    i === active ? "ring-primary" : "ring-transparent hover:ring-primary/40",
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ข้อมูลสินค้า */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="space-y-2">
            {product.category && (
              <Link
                to="/shop"
                className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>
            <p className="text-sm text-muted-foreground">ขายแล้ว {product.sold} ชิ้น</p>
          </div>

          <p className="text-3xl font-extrabold text-primary">{priceFormat(product.price)}</p>

          <div className="text-sm">
            {outOfStock ? (
              <span className="font-semibold text-destructive">สินค้าหมด</span>
            ) : (
              <span className="text-muted-foreground">
                คงเหลือ <span className="font-semibold text-foreground">{product.quantity}</span> ชิ้น
                {inCart > 0 && <> · อยู่ในตะกร้าแล้ว {inCart} ชิ้น</>}
              </span>
            )}
          </div>

          {product.description && (
            <div className="space-y-1 border-t pt-4">
              <h2 className="font-semibold">รายละเอียดสินค้า</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}

          <div className="mt-auto space-y-3 border-t pt-4">
            {!outOfStock && canAdd > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">จำนวน</span>
                <div className="flex items-center rounded-full ring-1 ring-border">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="ลดจำนวน"
                    className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-40"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-10 text-center font-semibold">{Math.min(qty, canAdd)}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(canAdd, q + 1))}
                    disabled={qty >= canAdd}
                    aria-label="เพิ่มจำนวน"
                    className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-40"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={addToCart}
                disabled={outOfStock}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 px-4 py-3 font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={18} /> ใส่ตะกร้า
              </button>
              <button
                onClick={buyNow}
                disabled={outOfStock}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap size={18} /> ซื้อเลย
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetail;
