import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Loader2, TicketPercent, X } from "lucide-react";
import { toast } from "react-toastify";
import { applyCoupon, removeCoupon } from "../api/user";
import { myCoupons } from "../api/coupon";
import CouponTicket from "./CouponTicket";
import { cn } from "@/lib/utils";
import { priceFormat } from "../utils/number";

// ช่องใส่โค้ดส่วนลด (หน้าชำระเงิน)
// coupon: คูปองที่ใช้อยู่ { code, label, description } หรือ null, onChange: เรียกเมื่อใส่/ถอดโค้ดสำเร็จ
// subtotal: ยอดสินค้า — ใช้เช็กว่าคูปองที่เก็บไว้ใบไหนใช้กับตะกร้านี้ได้
const CouponBox = ({ coupon, discount, onChange, subtotal }) => {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState([]); // คูปองที่เก็บไว้ (ยังไม่หมดอายุ/ไม่ครบจำนวน)
  const [showWallet, setShowWallet] = useState(true);
  const [applyingCode, setApplyingCode] = useState(null);

  useEffect(() => {
    if (!subtotal) return;
    myCoupons(subtotal)
      .then((res) => setWallet(res.data.filter((c) => c.status === "ready")))
      .catch(() => {});
  }, [subtotal]);

  // ใช้ได้ก่อน เรียงจากลดมากไปน้อย
  const sorted = [...wallet].sort((a, b) => b.usable - a.usable || b.discount - a.discount);
  const usableCount = wallet.filter((c) => c.usable).length;

  const applyFromWallet = async (c) => {
    setApplyingCode(c.code);
    setError("");
    try {
      const res = await applyCoupon(c.code);
      onChange(res.data);
      toast.success(`ใช้คูปอง ${c.code} แล้ว ลด ${priceFormat(res.data.discount)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "ใช้คูปองไม่สำเร็จ");
    } finally {
      setApplyingCode(null);
    }
  };

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await applyCoupon(code.trim());
      setCode("");
      onChange(res.data);
      toast.success(`ใช้โค้ด ${res.data.coupon.code} แล้ว ลด ${priceFormat(res.data.discount)}`);
    } catch (err) {
      setError(err.response?.data?.message || "ใช้โค้ดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeCoupon();
      onChange({ coupon: null, discount: 0 });
    } catch {
      toast.error("ถอดโค้ดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait" initial={false}>
        {coupon ? (
          // โค้ดที่ใช้อยู่ — หน้าตาแบบตั๋วคูปอง
          <motion.div
            key="applied"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2.5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white">
              <TicketPercent size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-bold tracking-wide text-emerald-800">{coupon.code}</p>
              <p className="truncate text-xs text-emerald-700">
                {coupon.description} · ประหยัด {priceFormat(discount)}
              </p>
            </div>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label="ถอดโค้ดส่วนลด"
              className="rounded-full p-1.5 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="input"
            onSubmit={apply}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <TicketPercent
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="โค้ดส่วนลด"
                aria-label="โค้ดส่วนลด"
                maxLength={40}
                className="h-10 w-full rounded-xl border bg-muted/40 pl-9 pr-3 font-mono text-sm uppercase tracking-wide outline-none ring-primary/30 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:bg-white focus:ring-2"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-opacity disabled:opacity-40"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              ใช้โค้ด
            </button>
          </motion.form>
        )}
      </AnimatePresence>
      {/* คูปองที่เก็บไว้ */}
      {sorted.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowWallet((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>
              คูปองของฉัน · ใช้ได้ <span className="text-primary">{usableCount}</span> จาก {sorted.length} ใบ
            </span>
            <ChevronDown size={14} className={cn("transition-transform", showWallet && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {showWallet && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                // เว้นขอบออกไปนอกกล่อง -> กรอบเขียว/เงาของตั๋วไม่ถูกตัด (กล่องนี้ซ่อนส่วนเกินระหว่างแอนิเมชัน)
                className="-mx-2 overflow-hidden px-2"
              >
                <div className="max-h-80 space-y-2 overflow-y-auto px-1 pb-2 pt-2">
                  {sorted.map((c, i) => {
                    const active = coupon?.code === c.code;
                    return (
                      <CouponTicket
                        key={c.id}
                        index={i}
                        compact
                        coupon={c}
                        highlight={active}
                        dimmed={!c.usable}
                        note={!c.usable ? c.reason : null}
                        action={
                          active ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">✓ ใช้อยู่</span>
                          ) : (
                            <button
                              type="button"
                              disabled={!c.usable || !!applyingCode}
                              onClick={() => applyFromWallet(c)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
                            >
                              {applyingCode === c.code && <Loader2 size={12} className="animate-spin" />}
                              {c.usable ? `ลด ${priceFormat(c.discount)}` : "ใช้ไม่ได้"}
                            </button>
                          )
                        }
                      />
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <Link to="/coupons" className="inline-block text-xs font-semibold text-primary hover:underline">
        + เก็บคูปองเพิ่ม
      </Link>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponBox;
