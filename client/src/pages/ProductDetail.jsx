import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, ChevronLeft, ChevronRight, ImageOff, Loader2, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "react-toastify";
import { readProduct } from "../api/product";
import { getRestockAlert, setRestockAlert } from "../api/user";
import { warnStockLimit } from "../utils/product";
import HeartButton from "../components/HeartButton";
import useEcomStore from "../store/ecom-store";
import { priceFormat } from "../utils/number";
import { cn } from "@/lib/utils";

// หน้ารายละเอียดสินค้า (/product/:id) — กดการ์ดสินค้าแล้วมาหน้านี้
const ProductDetail = ({ id }) => {
  const navigate = useNavigate();
  const carts = useEcomStore((s) => s.carts);
  const actionAddtoCart = useEcomStore((s) => s.actionAddtoCart);
  const actionUpdateQuantity = useEcomStore((s) => s.actionUpdateQuantity);
  const user = useEcomStore((s) => s.user);

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | notfound
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [subscribedRaw, setSubscribed] = useState(false); // กด "แจ้งเตือนเมื่อมีของ" ไว้แล้วหรือยัง
  const [subscribing, setSubscribing] = useState(false);
  const [hovering, setHovering] = useState(false); // เมาส์อยู่บนรูป -> หยุดเลื่อนอัตโนมัติ
  const reduceMotion = useReducedMotion();

  // เลื่อนรูปอัตโนมัติทุก 4 วินาที (กดเลือกรูปเอง = นับเวลาใหม่)
  const imageCount = product?.images?.length || 0;
  useEffect(() => {
    if (imageCount < 2 || hovering || reduceMotion) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % imageCount), 4000);
    return () => clearTimeout(t);
  }, [active, imageCount, hovering, reduceMotion]);
  const go = (step) => setActive((a) => (a + step + imageCount) % imageCount);

  useEffect(() => {
    let cancelled = false;
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

  // สินค้าหมด + login แล้ว -> เช็กว่าเคยกดรอไว้หรือยัง
  const soldOut = status === "ok" && product?.quantity <= 0;
  const subscribed = soldOut && !!user && subscribedRaw;
  useEffect(() => {
    if (!soldOut || !user) return;
    getRestockAlert(id)
      .then((res) => setSubscribed(res.data.subscribed))
      .catch(() => {});
  }, [id, soldOut, user]);

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
      warnStockLimit(toast, product);
      return false;
    }
    const amount = Math.min(qty, canAdd);
    if (!inCart) actionAddtoCart(product);
    actionUpdateQuantity(product.id, inCart + amount);
    toast.success(`เพิ่มลงตะกร้าแล้ว ${amount} ชิ้น`);
    setQty(1);
    return true;
  };

  const toggleRestock = async () => {
    if (!user) {
      toast.info("เข้าสู่ระบบก่อน เพื่อรับการแจ้งเตือนเมื่อสินค้ามีของ");
      navigate("/login");
      return;
    }
    setSubscribing(true);
    try {
      const res = await setRestockAlert(product.id, !subscribed);
      setSubscribed(res.data.subscribed);
      toast.success(res.data.subscribed ? "เราจะแจ้งเตือนเมื่อสินค้ากลับมามีของ" : "ยกเลิกการแจ้งเตือนแล้ว");
    } catch (error) {
      toast.error(error.response?.data?.message || "ทำรายการไม่สำเร็จ");
    } finally {
      setSubscribing(false);
    }
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
          <div
            className="group relative aspect-square overflow-hidden rounded-2xl bg-muted/60"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {images.length > 0 ? (
              <motion.img
                key={images[active]?.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[active]?.url}
                alt={product.title}
                draggable={false}
                // ปัดซ้าย/ขวาเพื่อเปลี่ยนรูป (มือถือ / ลากเมาส์)
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) go(1);
                  else if (info.offset.x > 50) go(-1);
                }}
                className={cn("h-full w-full object-contain p-6", images.length > 1 && "cursor-grab active:cursor-grabbing")}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff size={40} />
                <span className="text-sm">ไม่มีรูปภาพ</span>
              </div>
            )}
            {images.length > 1 && (
              <>
                {[
                  { step: -1, Icon: ChevronLeft, label: "รูปก่อนหน้า", side: "left-3" },
                  { step: 1, Icon: ChevronRight, label: "รูปถัดไป", side: "right-3" },
                ].map(({ step, Icon, label, side }) => (
                  <button
                    key={step}
                    onClick={() => go(step)}
                    aria-label={label}
                    className={cn(
                      "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white md:opacity-0 md:group-hover:opacity-100",
                      side,
                    )}
                  >
                    <Icon size={18} />
                  </button>
                ))}
                <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
            {outOfStock && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 text-lg font-semibold text-muted-foreground">
                สินค้าหมด
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto p-1">
              {images.map((img, i) => (
                <button
                  key={img.id ?? img.url}
                  onClick={() => setActive(i)}
                  aria-label={`ดูรูปที่ ${i + 1}`}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:size-20",
                    i === active ? "border-primary" : "border-border hover:border-primary/40",
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-contain p-1.5" />
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
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>
              <HeartButton productId={product.id} className="size-11 shrink-0" size={22} />
            </div>
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
                    onClick={() => (qty >= canAdd ? warnStockLimit(toast, product) : setQty(qty + 1))}
                    aria-label="เพิ่มจำนวน"
                    className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-40"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            )}

            {outOfStock && (
              <button
                onClick={toggleRestock}
                disabled={subscribing}
                className={
                  subscribed
                    ? "inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 font-semibold text-muted-foreground transition hover:bg-muted active:scale-[0.97] disabled:opacity-60"
                    : "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.97] disabled:opacity-60"
                }
              >
                {subscribed ? <BellOff size={18} /> : <Bell size={18} />}
                {subscribed ? "รอแจ้งเตือนอยู่ · กดเพื่อยกเลิก" : "แจ้งเตือนเมื่อสินค้ามีของ"}
              </button>
            )}

            <div className={outOfStock ? "hidden" : "grid grid-cols-2 gap-3"}>
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

// key={id}: เปลี่ยนสินค้าแล้วเริ่ม state ใหม่ทั้งหมด (รูปที่เลือก, จำนวน, สถานะโหลด)
const ProductDetailPage = () => {
  const { id } = useParams();
  return <ProductDetail key={id} id={id} />;
};

export default ProductDetailPage;
