import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckCircle2, MapPin } from "lucide-react";
import useEcomStore from "../store/ecom-store";
import { listUserCart, saveAddress } from "../api/user";
import { priceFormat } from "../utils/number";
import { Button } from "@/components/ui/button";

const Checkout = () => {
  const user = useEcomStore((state) => state.user);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [address, setAddress] = useState("");
  const [addressSaved, setAddressSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    listUserCart()
      .then((res) => {
        setProducts(res.data.products);
        setCartTotal(res.data.cartTotal);
      })
      .catch((err) => console.log(err));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-sm">
        <p className="mb-4">กรุณาเข้าสู่ระบบก่อนชำระเงิน</p>
        <Button asChild className="rounded-full">
          <Link to="/login">เข้าสู่ระบบ</Link>
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!address.trim()) {
      return toast.warning("กรุณากรอกที่อยู่จัดส่ง");
    }
    setSaving(true);
    try {
      const res = await saveAddress(address.trim());
      toast.success(res.data.message || "บันทึกที่อยู่เรียบร้อย");
      setAddressSaved(true);
    } catch (err) {
      console.log(err);
      toast.error("บันทึกที่อยู่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const goToPayment = () => {
    if (!addressSaved) {
      return toast.warning("กรุณาบันทึกที่อยู่จัดส่งก่อน");
    }
    navigate("/user/payment");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">ชำระเงิน</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ที่อยู่ */}
        <section className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <MapPin size={20} className="text-primary" /> ที่อยู่ในการจัดส่ง
          </h2>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setAddressSaved(false);
            }}
            rows={5}
            placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
            className="w-full resize-none rounded-xl border bg-muted/40 p-3 text-sm outline-none ring-primary/30 focus:bg-white focus:ring-2"
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} variant="secondary" className="rounded-full px-5">
              {saving ? "กำลังบันทึก..." : "บันทึกที่อยู่"}
            </Button>
            {addressSaved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 size={16} /> บันทึกแล้ว
              </span>
            )}
          </div>
        </section>

        {/* สรุปคำสั่งซื้อ */}
        <aside className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-bold">คำสั่งซื้อของคุณ</h2>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {products.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.product.title}</p>
                  <p className="text-muted-foreground">
                    {item.count} × {priceFormat(item.product.price)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{priceFormat(item.count * item.product.price)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>ค่าจัดส่ง</span>
              <span className="text-emerald-600">ฟรี</span>
            </div>
            <div className="flex justify-between">
              <span>ส่วนลด</span>
              <span>{priceFormat(0)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-semibold">ยอดรวมสุทธิ</span>
            <span className="text-2xl font-extrabold text-primary">{priceFormat(cartTotal)}</span>
          </div>

          <Button
            onClick={goToPayment}
            disabled={products.length === 0}
            className="h-11 w-full rounded-full text-base"
          >
            ไปหน้าชำระเงิน
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
