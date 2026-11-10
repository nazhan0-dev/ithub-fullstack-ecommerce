import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CreditCard } from "lucide-react";
import { payment } from "../../api/stripe";
import CheckoutForm from "../../components/CheckoutForm";
import { priceFormat } from "../../utils/number";

// Stripe publishable key มาจาก client/.env (VITE_STRIPE_PUBLISHABLE_KEY) เท่านั้น — ไม่ hardcode ในโค้ด
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#6d4aff",
    borderRadius: "12px",
  },
};

const Payment = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [summary, setSummary] = useState(null); // { subtotal, discount, total, coupon }
  // ไม่ได้ตั้ง key -> แสดงข้อความแทนฟอร์มบัตร (และไม่สร้างรายการชำระเงินที่ Stripe)
  const [error, setError] = useState(
    STRIPE_KEY ? "" : "ระบบชำระเงินยังไม่พร้อมใช้งาน: ไม่ได้ตั้งค่า VITE_STRIPE_PUBLISHABLE_KEY ใน client/.env",
  );

  useEffect(() => {
    if (!STRIPE_KEY) return;
    payment()
      .then((res) => {
        setClientSecret(res.data.clientSecret);
        setSummary(res.data);
      })
      .catch((err) => {
        console.log(err);
        setError(err.response?.data?.message || "ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
      });
  }, []);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="text-center">
        <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <CreditCard size={26} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">ชำระเงิน</h1>
        <p className="text-sm text-muted-foreground">กรอกข้อมูลบัตรเพื่อยืนยันคำสั่งซื้อ</p>
      </div>

      {summary && (
        <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-5 py-4">
          <div className="text-sm">
            <p className="text-muted-foreground">ยอดที่ต้องชำระ</p>
            {summary.discount > 0 && (
              <p className="text-xs text-emerald-700">
                ใช้โค้ด <span className="font-mono font-semibold">{summary.coupon?.code}</span> ลด{" "}
                {priceFormat(summary.discount)}
              </p>
            )}
          </div>
          <div className="text-right">
            {summary.discount > 0 && (
              <p className="text-xs text-muted-foreground line-through">{priceFormat(summary.subtotal)}</p>
            )}
            <p className="text-2xl font-extrabold text-primary">{priceFormat(summary.total)}</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : clientSecret ? (
          <Elements options={{ clientSecret, appearance, loader: "auto" }} stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        ) : (
          <div className="space-y-3">
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
