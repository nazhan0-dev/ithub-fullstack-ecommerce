import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import "../stripe.css";
import { saveOrder } from "../api/user";
import useEcomStore from "../store/ecom-store";

export default function CheckoutForm() {
  const token = useEcomStore((state) => state.token);
  const clearCart = useEcomStore((state) => state.clearCart);
  const navigate = useNavigate();

  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);
    try {
      const payload = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (payload.error) {
        setMessage(payload.error.message);
        toast.error(payload.error.message);
      } else if (payload.paymentIntent.status === "succeeded") {
        await saveOrder(token, payload);
        clearCart();
        toast.success("ชำระเงินสำเร็จ!");
        navigate("/user/history");
      } else {
        toast.warning("ชำระเงินไม่สำเร็จ");
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <button className="stripe-button" disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "ชำระเงิน"}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
      <p className="secure-badge">
        <Lock size={12} /> ชำระเงินอย่างปลอดภัยผ่าน Stripe
      </p>
    </form>
  );
}
