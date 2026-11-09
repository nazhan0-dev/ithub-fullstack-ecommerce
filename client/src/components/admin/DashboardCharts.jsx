import { useState } from "react";
import moment from "moment";
import { priceFormat, numberFormat } from "../../utils/number";
import { cn } from "@/lib/utils";

/* ---------- ยอดขายรายวัน (แท่งแนวตั้ง, ชุดข้อมูลเดียว) ---------- */
export const RevenueChart = ({ orders, days, onShowLonger }) => {
  const [hover, setHover] = useState(null);

  // ช่วงยาวกว่า 90 วัน -> รวมเป็นรายเดือน, ไม่งั้นรายวัน (ช่วงที่ไม่มียอดขาย = 0)
  const monthly = days > 90;
  const unit = monthly ? "months" : "days";
  const keyFmt = monthly ? "YYYY-MM" : "YYYY-MM-DD";
  const n = monthly ? 12 : days;
  const buckets = Array.from({ length: n }, (_, i) => {
    const d = moment().startOf(monthly ? "month" : "day").subtract(n - 1 - i, unit);
    return { key: d.format(keyFmt), date: d, total: 0, count: 0 };
  });
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
  orders
    .filter((o) => o.orderStatus !== "Cancelled")
    .forEach((o) => {
      const i = index[moment(o.createdAt).format(keyFmt)];
      if (i !== undefined) {
        buckets[i].total += o.cartTotal;
        buckets[i].count += 1;
      }
    });

  const hasData = buckets.some((b) => b.total > 0);
  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
        <p className="text-sm font-medium">ไม่มียอดขายในช่วงนี้</p>
        <p className="text-xs text-muted-foreground">ลองเลือกช่วงเวลาที่ยาวขึ้น</p>
        {onShowLonger && (
          <button onClick={onShowLonger} className="mt-1 text-sm font-semibold text-primary hover:underline">
            ดูย้อนหลัง 12 เดือน
          </button>
        )}
      </div>
    );
  }

  const max = Math.max(...buckets.map((b) => b.total), 1);
  // เส้นกริด 3 ระดับแบบปัดเลขสวย
  const step = niceStep(max / 3);
  const top = Math.max(step * 3, step);
  const labelEvery = monthly ? 1 : days > 30 ? 10 : days > 14 ? 5 : days > 7 ? 2 : 1;
  const dateLabel = (d) => (monthly ? d.format("MMM") : d.format("D/M"));
  const tipLabel = (d) => (monthly ? d.format("MMMM YYYY") : d.format("D MMM YYYY"));

  return (
    <div className="relative">
      <div className="flex h-56">
        {/* แกน Y */}
        <div className="relative w-14 shrink-0 text-right text-[11px] text-muted-foreground">
          {[3, 2, 1, 0].map((n) => (
            <span key={n} className="absolute right-2 -translate-y-1/2" style={{ top: `${100 - (n * step * 100) / top}%` }}>
              {compact(n * step)}
            </span>
          ))}
        </div>

        {/* พื้นที่กราฟ */}
        <div className="relative flex-1">
          {[1, 2, 3].map((n) => (
            <div key={n} className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ top: `${100 - (n * step * 100) / top}%` }} />
          ))}
          <div className="absolute inset-x-0 bottom-0 border-t border-border" />

          <div className="absolute inset-0 flex items-end gap-[2px]">
            {buckets.map((b, i) => (
              <div
                key={b.key}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={cn(
                    "mx-auto w-full max-w-7 rounded-t-[4px] bg-primary transition-opacity",
                    hover !== null && hover !== i && "opacity-40",
                  )}
                  style={{ height: `${(b.total / top) * 100}%`, minHeight: b.total > 0 ? 2 : 0 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg">
                    <p className="font-semibold">{tipLabel(b.date)}</p>
                    <p>ยอดขาย {priceFormat(b.total)}</p>
                    <p className="opacity-70">{b.count} คำสั่งซื้อ</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* แกน X */}
      <div className="ml-14 mt-2 flex gap-[2px] text-[11px] text-muted-foreground">
        {buckets.map((b, i) => (
          <span key={b.key} className="flex-1 text-center">
            {(n - 1 - i) % labelEvery === 0 ? dateLabel(b.date) : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------- สถานะคำสั่งซื้อ (แท่งแนวนอน + ป้ายชื่อ + จำนวน) ---------- */
const STATUS = [
  { key: "Not Process", label: "รอดำเนินการ", color: "bg-zinc-400" },
  { key: "Processing", label: "กำลังดำเนินการ", color: "bg-blue-500" },
  { key: "Completed", label: "สำเร็จ", color: "bg-emerald-500" },
  { key: "Cancelled", label: "ยกเลิก", color: "bg-red-500" },
];

export const StatusBreakdown = ({ orders }) => {
  const total = orders.length || 1;
  return (
    <ul className="space-y-4">
      {STATUS.map((s) => {
        const count = orders.filter((o) => o.orderStatus === s.key).length;
        const pct = Math.round((count / total) * 100);
        return (
          <li key={s.key} title={`${s.label}: ${count} รายการ (${pct}%)`}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", s.color)} />
                {s.label}
              </span>
              <span className="font-semibold">
                {numberFormat(count)} <span className="font-normal text-muted-foreground">· {pct}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", s.color)} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/* ---------- สินค้าขายดี (แท่งแนวนอน สีเดียว) ---------- */
export const TopProducts = ({ products, limit = 5 }) => {
  const top = [...products].sort((a, b) => b.sold - a.sold).filter((p) => p.sold > 0).slice(0, limit);
  const max = Math.max(...top.map((p) => p.sold), 1);

  if (top.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มียอดขาย</p>;
  }
  return (
    <ol className="space-y-3">
      {top.map((p, i) => (
        <li key={p.id} title={`${p.title}: ขายแล้ว ${p.sold} ชิ้น`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
              <span className="truncate">{p.title}</span>
            </span>
            <span className="shrink-0 font-semibold">{numberFormat(p.sold)} ชิ้น</span>
          </div>
          <div className="ml-6 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(p.sold / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
};

/* ---------- helpers ---------- */
function niceStep(raw) {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function compact(n) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`;
  return String(n);
}
