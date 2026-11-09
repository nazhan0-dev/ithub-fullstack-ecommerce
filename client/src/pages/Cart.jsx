import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ImageOff, Minus, Plus, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import useEcomStore from "../store/ecom-store";
import { createUserCart } from "../api/user";
import { priceFormat } from "../utils/number";
import { warnStockLimit } from "../utils/product";
import { Button } from "@/components/ui/button";

const Cart = () => {
  const carts = useEcomStore((state) => state.carts);
  const user = useEcomStore((state) => state.user);
  const getTotalPrice = useEcomStore((state) => state.getTotalPrice);
  const actionUpdateQuantity = useEcomStore((state) => state.actionUpdateQuantity);
  const actionRemoveProduct = useEcomStore((state) => state.actionRemoveProduct);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const itemCount = carts.reduce((sum, item) => sum + item.count, 0);

  const handleSaveCart = async () => {
    setSaving(true);
    try {
      await createUserCart({ cart: carts });
      navigate("/checkout");
    } catch (err) {
      console.log(err);
      toast.warning(err.response?.data?.message || "บันทึกตะกร้าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (carts.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
          <ShoppingCart size={28} />
        </span>
        <div>
          <h1 className="text-xl font-bold">ตะกร้าของคุณยังว่างอยู่</h1>
          <p className="text-sm text-muted-foreground">เลือกสินค้าที่ชอบแล้วเพิ่มลงตะกร้าได้เลย</p>
        </div>
        <Button asChild className="rounded-full px-6">
          <Link to="/shop">เลือกซื้อสินค้า</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          ตะกร้าสินค้า <span className="text-muted-foreground">({itemCount})</span>
        </h1>
        <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> เลือกซื้อต่อ
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* รายการสินค้า */}
        <div className="space-y-3">
          {carts.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:gap-4"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted/60 sm:size-24">
                {item.images?.length > 0 ? (
                  <img src={item.images[0].url} alt={item.title} className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageOff size={24} />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold leading-snug">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{priceFormat(item.price)} / ชิ้น</p>
                  </div>
                  <button
                    onClick={() => actionRemoveProduct(item.id)}
                    aria-label="ลบสินค้า"
                    className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-full bg-muted p-1">
                    <button
                      onClick={() => actionUpdateQuantity(item.id, item.count - 1)}
                      disabled={item.count <= 1}
                      aria-label="ลดจำนวน"
                      className="flex size-7 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{item.count}</span>
                    <button
                      onClick={() =>
                        item.quantity !== undefined && item.count >= item.quantity
                          ? warnStockLimit(toast, item)
                          : actionUpdateQuantity(item.id, item.count + 1)
                      }
                      aria-label="เพิ่มจำนวน"
                      className="flex size-7 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-bold text-primary">{priceFormat(item.price * item.count)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* สรุปยอด */}
        <aside className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">สรุปคำสั่งซื้อ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>ยอดรวมสินค้า ({itemCount} ชิ้น)</span>
              <span>{priceFormat(getTotalPrice())}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ค่าจัดส่ง</span>
              <span className="text-emerald-600">ฟรี</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">รวมสุทธิ</span>
            <span className="text-2xl font-extrabold">{priceFormat(getTotalPrice())}</span>
          </div>

          {user ? (
            <Button onClick={handleSaveCart} disabled={saving} className="h-11 w-full rounded-full text-base">
              {saving ? "กำลังบันทึก..." : "ดำเนินการสั่งซื้อ"}
            </Button>
          ) : (
            <Button asChild className="h-11 w-full rounded-full text-base">
              <Link to="/login" state={{ from: "/cart" }}>
                เข้าสู่ระบบเพื่อสั่งซื้อ
              </Link>
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Cart;
