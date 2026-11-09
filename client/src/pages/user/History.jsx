import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardCheck, Loader2, Package, PackageCheck, Truck, XCircle } from "lucide-react";
import { AnimatePresence, MotionConfig, animate, motion } from "motion/react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { cancelOrder, getOrders } from "../../api/user";
import { priceFormat } from "../../utils/number";
import { dateFormat } from "../../utils/dateformat";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { ORDER_STATUSES, STATUS_LABELS, orderCode } from "../../utils/orderStatus";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 380, damping: 26 };

// ขั้นตอนของคำสั่งซื้อ (ยกเลิก = แสดงแยก)
// idle: ท่าขยับของไอคอนตอนเป็น "ขั้นปัจจุบัน" (รถวิ่ง, คลิปบอร์ดเด้ง)
const STEPS = [
  {
    status: "Not Process",
    label: "ได้รับคำสั่งซื้อ",
    icon: ClipboardCheck,
    idle: { y: [0, -2, 0], transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" } },
  },
  {
    status: "Processing",
    label: "กำลังจัดส่ง",
    icon: Truck,
    idle: { x: [-2, 2, -2], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
  },
  { status: "Completed", label: "สำเร็จ", icon: PackageCheck },
];

// ตัวเลขวิ่งจาก 0 ถึงยอดจริง
const CountUp = ({ value }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return priceFormat(shown);
};

const OrderProgress = ({ status, updatedAt, refunded }) => {
  if (status === "Cancelled") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <XCircle size={18} className="shrink-0" />
        <span>
          คำสั่งซื้อนี้ถูกยกเลิก{refunded && " · คืนเงินเต็มจำนวนแล้ว"}{" "}
          <span className="text-red-600/70">· {dateFormat(updatedAt)}</span>
        </span>
      </motion.div>
    );
  }

  const current = Math.max(0, STEPS.findIndex((s) => s.status === status));
  const completed = status === "Completed";

  return (
    <ol className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i < current || completed;
        const active = i === current && !completed;
        const Icon = done ? Check : step.icon;
        const delay = 0.15 + i * 0.25; // ไล่ทีละขั้น
        return (
          <li key={step.status} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            {/* เส้นเชื่อมไปขั้นถัดไป — เติมสีหลังไอคอนขั้นนี้โผล่ */}
            {i < STEPS.length - 1 && (
              <span className="absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-muted">
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < current || completed ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: delay + 0.15, ease: "easeOut" }}
                  className="block h-full origin-left bg-primary"
                />
              </span>
            )}

            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring, delay }}
              className={cn(
                "relative z-10 grid size-8 place-items-center rounded-full ring-4 ring-white",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {active && <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />}
              {/* ขั้นสุดท้ายสำเร็จ -> วงแสงกระจายออกครั้งเดียว */}
              {completed && i === STEPS.length - 1 && (
                <motion.span
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.8, delay: delay + 0.2 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <motion.span animate={active ? step.idle : undefined} className="grid place-items-center">
                <Icon size={15} strokeWidth={done ? 3 : 2} />
              </motion.span>
            </motion.span>

            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.05 }}
              className={cn(
                "text-xs leading-tight",
                done || active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </motion.span>
          </li>
        );
      })}
    </ol>
  );
};

// ref: AnimatePresence (popLayout) ต้องเข้าถึง DOM ของการ์ด — React 19 ส่ง ref มาเป็น prop ได้เลย
const OrderCard = ({ order, index, ref, onCancel, cancelling }) => (
  <motion.article
    ref={ref}
    layout
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0, transition: { ...spring, delay: Math.min(index, 5) * 0.07 } }}
    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
    whileHover={{ y: -3 }}
    transition={spring}
    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-lg hover:shadow-primary/5"
  >
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
      <div>
        <p className="font-mono text-xs font-medium text-muted-foreground">#{orderCode(order.id)}</p>
        <p className="font-semibold">{dateFormat(order.createdAt)}</p>
      </div>
      <OrderStatusBadge status={order.orderStatus} />
    </header>

    <div className="border-b px-5 py-4">
      <OrderProgress status={order.orderStatus} updatedAt={order.updatedAt} refunded={order.status === "refunded"} />
    </div>

    <div className="divide-y px-5">
      {order.products?.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
          className="flex items-center justify-between gap-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{item.product.title}</p>
            <p className="text-muted-foreground">
              {item.count} × {priceFormat(item.price ?? item.product.price)}
            </p>
          </div>
          <p className="shrink-0 font-semibold">
            {priceFormat(item.count * (item.price ?? item.product.price))}
          </p>
        </motion.div>
      ))}
    </div>

    <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-muted-foreground">รวมสุทธิ</span>
        <span className="text-lg font-extrabold tabular-nums text-primary">
          <CountUp value={order.cartTotal} />
        </span>
      </div>
      {/* ยกเลิกได้เฉพาะตอนร้านยังไม่เริ่มดำเนินการ */}
      {order.orderStatus === "Not Process" && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onCancel(order)}
          disabled={cancelling}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
          {cancelling ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
        </motion.button>
      )}
    </footer>
  </motion.article>
);

const History = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (order) => {
    const confirm = await Swal.fire({
      title: `ยกเลิกคำสั่งซื้อ #${orderCode(order.id)}?`,
      html: `ระบบจะคืนเงิน <b>${priceFormat(order.cartTotal)}</b> เข้าบัตรที่ใช้ชำระ<br/><small>(ใช้เวลา 5–10 วันทำการตามธนาคาร)</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "ยกเลิกคำสั่งซื้อ",
      cancelButtonText: "ไม่ยกเลิก",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;
    setCancellingId(order.id);
    try {
      const res = await cancelOrder(order.id);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, ...res.data.order } : o)));
      toast.success("ยกเลิกคำสั่งซื้อแล้ว กำลังคืนเงิน");
    } catch (error) {
      toast.error(error.response?.data?.message || "ยกเลิกคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    getOrders()
      // ล่าสุดก่อน
      .then((res) => setOrders([...(res.data.orders || [])].sort((a, b) => b.id - a.id)))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const shown = filter === "all" ? orders : orders.filter((o) => o.orderStatus === filter);

  return (
    // ผู้ใช้ที่ตั้ง "ลดการเคลื่อนไหว" ในเครื่อง -> ปิดแอนิเมชันการเคลื่อนที่
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-4xl space-y-5">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          ประวัติการสั่งซื้อ
        </motion.h1>

        {/* แท็บกรองตามสถานะ — พื้นสีม่วงเลื่อนตามแท็บที่เลือก */}
        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            {["all", ...ORDER_STATUSES].map((key) => {
              const count = key === "all" ? orders.length : orders.filter((o) => o.orderStatus === key).length;
              const selected = filter === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => setFilter(key)}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    selected
                      ? "text-primary-foreground"
                      : "bg-white text-muted-foreground ring-1 ring-black/5 hover:text-foreground",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="history-tab"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/30"
                    />
                  )}
                  <span className="relative">{key === "all" ? "ทั้งหมด" : STATUS_LABELS[key]}</span>
                  <span
                    className={cn(
                      "relative rounded-full px-1.5 text-xs transition-colors",
                      selected ? "bg-white/20" : "bg-muted",
                    )}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm ring-1 ring-black/5"
          >
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Package size={44} strokeWidth={1.5} className="text-muted-foreground" />
            </motion.span>
            <p className="text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
            <Button asChild className="rounded-full">
              <Link to="/shop">เริ่มช้อปเลย</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {/* popLayout: การ์ดที่ถูกกรองออกหายไป แล้วการ์ดที่เหลือเลื่อนขึ้นมาแทนที่ */}
            <AnimatePresence mode="popLayout" initial={true}>
              {shown.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  onCancel={handleCancel}
                  cancelling={cancellingId === order.id}
                />
              ))}
              {shown.length === 0 && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-white py-12 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-black/5"
                >
                  ไม่มีคำสั่งซื้อในสถานะนี้
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MotionConfig>
  );
};

export default History;
