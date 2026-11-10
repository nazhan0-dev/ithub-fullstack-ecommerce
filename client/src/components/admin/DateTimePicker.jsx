import { useState } from "react";
import { Popover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ตัวเลือกวัน-เวลา (แทน <input type="datetime-local"> ของเบราว์เซอร์)
// value / onChange: สตริงเวลาเครื่อง "YYYY-MM-DDTHH:mm" หรือ "" (ไม่กำหนด) — รูปแบบเดียวกับ datetime-local
// defaultTime: เวลาเริ่มต้นเมื่อเลือกวันครั้งแรก เช่น "00:00" (วันเริ่ม) / "23:59" (วันหมดอายุ)

const MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"]; // เริ่มวันจันทร์
const TIME_PRESETS = ["00:00", "12:00", "23:59"];

const pad = (n) => String(n).padStart(2, "0");
const toValue = (d, time) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${time}`;
const parse = (v) => {
  if (!v) return null;
  const [date, time = "00:00"] = v.split("T");
  const [y, m, d] = date.split("-").map(Number);
  return { date: new Date(y, m - 1, d), time: time.slice(0, 5) };
};
const sameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// วันในตาราง 6 แถว (รวมวันท้ายเดือนก่อน/ต้นเดือนถัดไป)
const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // จันทร์ = 0
  return Array.from(
    { length: 42 },
    (_, i) => new Date(year, month, 1 - offset + i),
  );
};

const DateTimePicker = ({
  id,
  value,
  onChange,
  defaultTime = "00:00",
  placeholder = "ไม่กำหนด",
}) => {
  const picked = parse(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = picked?.date || new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const [dir, setDir] = useState(0); // ทิศเลื่อนเดือน (แอนิเมชัน)
  const today = new Date();
  const time = picked?.time || defaultTime;
  const [hh, mm] = time.split(":");

  const openChange = (v) => {
    setOpen(v);
    // เปิดใหม่ -> กลับไปเดือนของวันที่เลือกไว้
    if (v) {
      const base = picked?.date || new Date();
      setView({ y: base.getFullYear(), m: base.getMonth() });
    }
  };
  const shiftMonth = (step) => {
    setDir(step);
    setView(({ y, m }) => {
      const d = new Date(y, m + step, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const pickDate = (d) => onChange(toValue(d, time));
  const setTime = (t) => onChange(toValue(picked?.date || today, t));
  const setPart = (part, raw) => {
    const max = part === "h" ? 23 : 59;
    const n = Math.min(
      max,
      Math.max(0, parseInt(raw.replace(/\D/g, "") || "0", 10)),
    );
    setTime(part === "h" ? `${pad(n)}:${mm}` : `${hh}:${pad(n)}`);
  };
  const preset = (days, endOfMonth = false) => {
    const d = new Date();
    if (endOfMonth) d.setMonth(d.getMonth() + 1, 0);
    else d.setDate(d.getDate() + days);
    onChange(toValue(d, time));
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const label = picked
    ? `${picked.date.getDate()} ${MONTHS_SHORT[picked.date.getMonth()]} ${picked.date.getFullYear()} · ${picked.time} น.`
    : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={openChange}>
      <div className="relative">
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm outline-none ring-primary/30 transition hover:border-primary/40 focus:border-primary focus:ring-2",
              open && "border-primary ring-2",
            )}
          >
            <CalendarDays
              size={16}
              className={picked ? "text-primary" : "text-muted-foreground"}
            />
            <span
              className={cn(
                "flex-1 truncate",
                !picked && "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </button>
        </Popover.Trigger>
        {picked && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="ล้างวันที่"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          // ไม่ให้สูงเกินพื้นที่ที่เหลือบนจอ (ถ้าจอเตี้ยมากจะเลื่อนดูได้)
          className="z-50 max-h-[var(--radix-popover-content-available-height)] w-[19rem] overflow-y-auto rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* หัวปฏิทิน */}
          <div className="mb-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="เดือนก่อน"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold">
              {MONTHS[view.m]} {view.y}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="เดือนถัดไป"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
            {WEEKDAYS.map((w, i) => (
              <span key={w} className={cn("py-1", i >= 5 && "text-rose-400")}>
                {w}
              </span>
            ))}
          </div>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div
                key={`${view.y}-${view.m}`}
                custom={dir}
                initial={{ x: dir * 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir * -40, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-7 gap-y-0.5"
              >
                {monthGrid(view.y, view.m).map((d) => {
                  const inMonth = d.getMonth() === view.m;
                  const selected = sameDay(d, picked?.date);
                  const isToday = sameDay(d, today);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => pickDate(d)}
                      className={cn(
                        "mx-auto grid size-8 place-items-center rounded-full text-sm transition-colors",
                        selected
                          ? "bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/30"
                          : inMonth
                            ? "hover:bg-secondary hover:text-secondary-foreground"
                            : "text-muted-foreground/40 hover:bg-muted",
                        isToday &&
                          !selected &&
                          "font-bold text-primary ring-1 ring-primary/40",
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* เวลา */}
          <div className="mt-2 flex items-center gap-2 border-t pt-2.5">
            <Clock size={15} className="shrink-0 text-muted-foreground" />
            <div className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1">
              <input
                aria-label="ชั่วโมง"
                inputMode="numeric"
                maxLength={2}
                value={hh}
                onChange={(e) => setPart("h", e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-7 bg-transparent text-center font-mono text-sm font-semibold outline-none"
              />
              <span className="font-semibold text-muted-foreground">:</span>
              <input
                aria-label="นาที"
                inputMode="numeric"
                maxLength={2}
                value={mm}
                onChange={(e) => setPart("m", e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-7 bg-transparent text-center font-mono text-sm font-semibold outline-none"
              />
              <span className="text-xs text-muted-foreground">น.</span>
            </div>
            <div className="ml-auto flex gap-1">
              {TIME_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={cn(
                    "rounded-full px-2 py-1 font-mono text-[11px] transition-colors",
                    time === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ทางลัด */}
          <div className="mt-2.5 flex items-center gap-1 border-t pt-2.5">
            {[
              ["วันนี้", 0],
              ["+7 วัน", 7],
              ["+30 วัน", 30],
            ].map(([l, n]) => (
              <button
                key={l}
                type="button"
                onClick={() => preset(n)}
                className="rounded-full border px-2 py-1 text-[11px] font-medium hover:border-primary/40 hover:text-primary"
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              onClick={() => preset(0, true)}
              className="rounded-full border px-2 py-1 text-[11px] font-medium hover:border-primary/40 hover:text-primary"
            >
              สิ้นเดือน
            </button>
            <Popover.Close asChild>
              <button
                type="button"
                className="ml-auto rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                เสร็จ
              </button>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default DateTimePicker;
