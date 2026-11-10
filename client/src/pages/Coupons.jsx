import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, TicketPercent } from "lucide-react";
import { toast } from "react-toastify";
import useEcomStore from "../store/ecom-store";
import { collectCoupon, listAvailableCoupons, listCouponCenter, myCoupons } from "../api/coupon";
import CouponTicket from "../components/CouponTicket";
import { cn } from "@/lib/utils";

// จุดเล็ก ๆ กระจายออกตอนกดเก็บ
const Burst = () => (
  <span className="pointer-events-none absolute inset-0">
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: Math.cos(a) * 28, y: Math.sin(a) * 28, scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("absolute left-1/2 top-1/2 size-1.5 rounded-full", i % 2 ? "bg-primary" : "bg-fuchsia-400")}
        />
      );
    })}
  </span>
);

const CollectButton = ({ collected, busy, justCollected, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    disabled={collected || busy}
    className={cn(
      "relative inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors",
      collected ? "bg-emerald-50 text-emerald-700" : "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90",
    )}
  >
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={collected ? "done" : busy ? "busy" : "collect"}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="inline-flex items-center gap-1"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : collected ? <><Check size={15} strokeWidth={3} /> เก็บแล้ว</> : "เก็บ"}
      </motion.span>
    </AnimatePresence>
    {justCollected && <Burst />}
  </motion.button>
);

// หน้าเก็บคูปอง (/coupons) + คูปองของฉัน (/coupons?tab=mine)
const Coupons = () => {
  const user = useEcomStore((s) => s.user);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = user && params.get("tab") === "mine" ? "mine" : "center";

  const [center, setCenter] = useState(null);
  const [mine, setMine] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [justId, setJustId] = useState(null);

  useEffect(() => {
    (user ? listCouponCenter() : listAvailableCoupons())
      .then((res) => setCenter(res.data))
      .catch(() => setCenter([]));
  }, [user]);

  useEffect(() => {
    if (!user || tab !== "mine") return;
    myCoupons()
      .then((res) => setMine(res.data))
      .catch(() => setMine([]));
  }, [user, tab]);

  const collect = async (c) => {
    if (!user) {
      toast.info("เข้าสู่ระบบก่อน เพื่อเก็บคูปอง", { toastId: "coupon-login" });
      return navigate("/login");
    }
    setBusyId(c.id);
    try {
      await collectCoupon(c.id);
      setCenter((list) => list.map((x) => (x.id === c.id ? { ...x, collected: true } : x)));
      setMine(null); // โหลดใหม่เมื่อเปิดแท็บคูปองของฉัน
      setJustId(c.id);
      toast.success(`เก็บคูปอง ${c.code} แล้ว ใช้ได้ตอนชำระเงิน`);
    } catch (error) {
      toast.error(error.response?.data?.message || "เก็บคูปองไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const collectAll = async () => {
    for (const c of center.filter((x) => !x.collected)) await collect(c);
  };

  const notCollected = center?.filter((c) => !c.collected).length || 0;
  const ready = mine?.filter((c) => c.status === "ready") || [];
  const unusable = mine?.filter((c) => c.status !== "ready") || [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* หัวหน้า */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 p-6 text-white sm:p-8"
      >
        <motion.span
          animate={{ rotate: [0, -8, 8, 0], y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-4 -top-4 opacity-20"
        >
          <TicketPercent size={150} strokeWidth={1.2} />
        </motion.span>
        <div className="relative space-y-1">
          <h1 className="text-2xl font-extrabold sm:text-3xl">เก็บคูปองส่วนลด</h1>
          <p className="text-sm text-white/85">กดเก็บไว้ แล้วเลือกใช้ได้ตอนชำระเงิน ไม่ต้องจำโค้ด</p>
        </div>
      </motion.div>

      {/* แท็บ */}
      {user && (
        <div className="flex gap-2">
          {[["center", "เก็บคูปอง"], ["mine", "คูปองของฉัน"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setParams(key === "mine" ? { tab: "mine" } : {}, { replace: true })}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === key ? "text-primary-foreground" : "bg-white text-muted-foreground ring-1 ring-black/5",
              )}
            >
              {tab === key && (
                <motion.span layoutId="coupon-tab" className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
          {tab === "center" && notCollected > 1 && (
            <button onClick={collectAll} className="ml-auto text-sm font-semibold text-primary hover:underline">
              เก็บทั้งหมด ({notCollected})
            </button>
          )}
        </div>
      )}

      {tab === "center" ? (
        center === null ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}
          </div>
        ) : center.length === 0 ? (
          <Empty text="ตอนนี้ยังไม่มีคูปองแจก แวะมาใหม่เร็ว ๆ นี้" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {center.map((c, i) => (
              <CouponTicket
                key={c.id}
                index={i}
                coupon={c}
                action={
                  <CollectButton
                    collected={c.collected}
                    busy={busyId === c.id}
                    justCollected={justId === c.id}
                    onClick={() => collect(c)}
                  />
                }
              />
            ))}
          </div>
        )
      ) : mine === null ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : mine.length === 0 ? (
        <Empty text="ยังไม่ได้เก็บคูปอง" action={{ label: "ไปเก็บคูปอง", onClick: () => setParams({}, { replace: true }) }} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {ready.map((c, i) => (
              <CouponTicket
                key={c.id}
                index={i}
                coupon={c}
                action={
                  <Link to="/cart" className="shrink-0 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                    ใช้เลย
                  </Link>
                }
              />
            ))}
          </div>
          {unusable.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">ใช้ไม่ได้แล้ว</p>
              <div className="grid gap-3 md:grid-cols-2">
                {unusable.map((c, i) => (
                  <CouponTicket key={c.id} index={i} coupon={c} dimmed note={c.reason} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!user && (
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">เข้าสู่ระบบ</Link> เพื่อเก็บคูปองไว้ใช้
        </p>
      )}
    </div>
  );
};

const Empty = ({ text, action }) => (
  <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-14 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-black/5">
    <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
      <TicketPercent size={40} strokeWidth={1.5} />
    </motion.span>
    {text}
    {action && (
      <button onClick={action.onClick} className="font-semibold text-primary hover:underline">{action.label}</button>
    )}
  </div>
);

export default Coupons;
