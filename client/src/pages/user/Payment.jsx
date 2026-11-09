import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CreditCard } from "lucide-react";
import { payment } from "../../api/stripe";
import CheckoutForm from "../../components/CheckoutForm";

// ตั้งค่า VITE_STRIPE_PUBLISHABLE_KEY ใน client/.env เพื่อเปลี่ยน key ได้โดยไม่ต้องแก้โค้ด
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51TgFngDaedfPH6cGLRlfkKSh8xBbaHq4dVzGgLHo6dh03Kl20kurkUm9FXyjwVrbhszlYj5xqIqtiK62GAdHSsmF00PpafLwkm",
);

const appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#6d4aff",
    borderRadius: "12px",
  },
};

const Payment = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    payment()
      .then((res) => setClientSecret(res.data.clientSecret))
      .catch((err) => {
        console.log(err);
        setError("ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
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
