import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Copy, Pencil, Plus, Power, TicketPercent, Trash2 } from "lucide-react";
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from "../../api/coupon";
import { priceFormat } from "../../utils/number";
import { dateFormat } from "../../utils/dateformat";
import { FieldLabel, PageHeader, Panel, inputClass } from "../../components/admin/AdminUI";
import DateTimePicker from "../../components/admin/DateTimePicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// วันที่จาก server (UTC) <-> ช่อง datetime-local (เวลาเครื่อง)
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const emptyForm = {
  code: "",
  description: "",
  type: "percent",
  value: "",
  minOrder: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: "",
  expiresAt: "",
  isPublic: true,
};

// สถานะของคูปอง ณ ตอนนี้
const couponState = (c) => {
  const now = Date.now();
  if (!c.isActive) return { label: "ปิดใช้งาน", tone: "bg-zinc-100 text-zinc-600" };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return { label: "หมดอายุ", tone: "bg-red-100 text-red-700" };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: "ยังไม่เริ่ม", tone: "bg-amber-100 text-amber-700" };
  if (c.usageLimit != null && c.used >= c.usageLimit) return { label: "ใช้ครบแล้ว", tone: "bg-zinc-100 text-zinc-600" };
  return { label: "ใช้งานได้", tone: "bg-emerald-100 text-emerald-700" };
};

const CouponForm = ({ editing, onSaved, onCancel }) => {
  const [form, setForm] = useState(() =>
    editing
      ? {
          ...emptyForm,
          ...Object.fromEntries(
            Object.keys(emptyForm).map((k) => [k, editing[k] == null ? "" : String(editing[k])]),
          ),
          startsAt: toLocalInput(editing.startsAt),
          expiresAt: toLocalInput(editing.expiresAt),
          isPublic: !!editing.isPublic,
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, startsAt: fromLocalInput(form.startsAt), expiresAt: fromLocalInput(form.expiresAt) };
      const res = editing ? await updateCoupon(editing.id, payload) : await createCoupon(payload);
      toast.success(editing ? "บันทึกคูปองแล้ว" : `สร้างคูปอง ${res.data.code} แล้ว`);
      onSaved(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const isPercent = form.type === "percent";

  return (
    <Panel className="mb-6 p-5">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel htmlFor="c-code">โค้ด</FieldLabel>
            <input id="c-code" required value={form.code} maxLength={40}
              // รับเฉพาะ A-Z 0-9 . - _ (ตัวอื่นถูกตัดทิ้งตอนพิมพ์)
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, "") }))}
              placeholder="เช่น SALE11.11" className={cn(inputClass, "font-mono uppercase tracking-wide")} />
            <p className="mt-1 text-xs text-muted-foreground">A–Z, 0–9 และ . - _ (3–40 ตัว)</p>
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="c-desc">คำอธิบาย (ลูกค้าเห็น)</FieldLabel>
            <input id="c-desc" value={form.description} onChange={set("description")} maxLength={191}
              placeholder="เช่น ลด 10% สำหรับลูกค้าใหม่" className={inputClass} />
          </div>

          <div>
            <FieldLabel>ประเภทส่วนลด</FieldLabel>
            {/* สลับ % / บาท */}
            <div className="grid h-10 grid-cols-2 rounded-lg bg-muted p-1">
              {[["percent", "เปอร์เซ็นต์ (%)"], ["fixed", "จำนวนเงิน (฿)"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, type: v }))}
                  className={cn("rounded-md text-sm font-medium transition-colors",
                    form.type === v ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="c-value">{isPercent ? "ลดกี่ %" : "ลดกี่บาท"}</FieldLabel>
            <input id="c-value" required type="number" min="0.01" max={isPercent ? 100 : undefined} step="any"
              value={form.value} onChange={set("value")} placeholder={isPercent ? "10" : "100"} className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="c-max">ลดสูงสุด (บาท)</FieldLabel>
            <input id="c-max" type="number" min="0" step="any" value={isPercent ? form.maxDiscount : ""}
              onChange={set("maxDiscount")} disabled={!isPercent}
              placeholder={isPercent ? "ไม่จำกัด" : "ใช้กับแบบ % เท่านั้น"} className={cn(inputClass, "disabled:opacity-50")} />
          </div>

          <div>
            <FieldLabel htmlFor="c-min">ยอดสั่งซื้อขั้นต่ำ (บาท)</FieldLabel>
            <input id="c-min" type="number" min="0" step="any" value={form.minOrder} onChange={set("minOrder")}
              placeholder="ไม่มีขั้นต่ำ" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="c-limit">ใช้ได้ทั้งหมด (ครั้ง)</FieldLabel>
            <input id="c-limit" type="number" min="1" step="1" value={form.usageLimit} onChange={set("usageLimit")}
              placeholder="ไม่จำกัด" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="c-peruser">ต่อคนใช้ได้ (ครั้ง)</FieldLabel>
            <input id="c-peruser" type="number" min="1" step="1" value={form.perUserLimit} onChange={set("perUserLimit")}
              placeholder="ไม่จำกัด" className={inputClass} />
          </div>

          <div>
            <FieldLabel htmlFor="c-start">เริ่มใช้ได้</FieldLabel>
            <DateTimePicker id="c-start" value={form.startsAt} defaultTime="00:00" placeholder="ใช้ได้ทันที"
              onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))} />
          </div>
          <div>
            <FieldLabel htmlFor="c-end">หมดอายุ</FieldLabel>
            <DateTimePicker id="c-end" value={form.expiresAt} defaultTime="23:59" placeholder="ไม่มีวันหมดอายุ"
              onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))} />
          </div>
          <label className="flex cursor-pointer items-start gap-3 self-end rounded-xl bg-muted/50 p-3">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="mt-0.5 size-4 accent-primary" />
            <span className="text-sm">
              <span className="font-medium">แสดงในหน้าเก็บคูปอง</span>
              <span className="block text-xs text-muted-foreground">ปิด = ใช้ได้เฉพาะคนที่รู้โค้ด</span>
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>ยกเลิก</Button>
          <Button type="submit" disabled={saving} className="rounded-full px-6">
            {saving ? "กำลังบันทึก..." : editing ? "บันทึก" : "สร้างคูปอง"}
          </Button>
        </div>
      </form>
    </Panel>
  );
};

// หลังร้าน › คูปองส่วนลด
const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = ปิดฟอร์ม, "new" = สร้าง, object = แก้ไข

  useEffect(() => {
    listCoupons()
      .then((res) => setCoupons(res.data))
      .catch(() => toast.error("โหลดคูปองไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const saved = (coupon) => {
    setCoupons((list) =>
      list.some((c) => c.id === coupon.id) ? list.map((c) => (c.id === coupon.id ? coupon : c)) : [coupon, ...list],
    );
    setEditing(null);
  };

  const toggle = async (c) => {
    try {
      const res = await updateCoupon(c.id, { isActive: !c.isActive });
      saved(res.data);
      toast.success(res.data.isActive ? "เปิดใช้งานคูปองแล้ว" : "ปิดใช้งานคูปองแล้ว");
    } catch (error) {
      toast.error(error.response?.data?.message || "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const remove = async (c) => {
    const ok = await Swal.fire({
      title: `ลบคูปอง ${c.code}?`,
      text: c.used > 0 ? `มีการใช้ไปแล้ว ${c.used} ครั้ง — คำสั่งซื้อเดิมยังเก็บส่วนลดไว้` : "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!ok.isConfirmed) return;
    try {
      await deleteCoupon(c.id);
      setCoupons((list) => list.filter((x) => x.id !== c.id));
      toast.success("ลบคูปองแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const copy = (code) => {
    navigator.clipboard?.writeText(code).then(() => toast.info(`คัดลอก ${code} แล้ว`), () => {});
  };

  const usable = coupons.filter((c) => couponState(c).label === "ใช้งานได้").length;

  return (
    <div>
      <PageHeader
        title="คูปองส่วนลด"
        description={`ใช้งานได้ ${usable} จาก ${coupons.length} คูปอง · ลูกค้าใส่โค้ดได้ที่หน้าชำระเงิน`}
        action={
          !editing && (
            <Button onClick={() => setEditing("new")} className="rounded-full">
              <Plus /> สร้างคูปอง
            </Button>
          )
        }
      />

      {editing && (
        <CouponForm
          key={editing === "new" ? "new" : editing.id}
          editing={editing === "new" ? null : editing}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : coupons.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 py-14 text-center text-sm text-muted-foreground">
          <TicketPercent size={36} strokeWidth={1.5} />
          ยังไม่มีคูปอง — กด "สร้างคูปอง" เพื่อเริ่ม
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const state = couponState(c);
            const percentUsed = c.usageLimit ? Math.min(100, (c.used / c.usageLimit) * 100) : null;
            return (
              // หน้าตาแบบตั๋ว: ฝั่งซ้ายเป็นมูลค่าส่วนลด
              <Panel key={c.id} className={cn("flex overflow-hidden", !c.isActive && "opacity-60")}>
                <div className="flex w-24 shrink-0 flex-col items-center justify-center border-r-2 border-dashed bg-gradient-to-br from-primary to-violet-500 p-3 text-center text-white">
                  <span className="text-2xl font-extrabold leading-none">
                    {c.type === "percent" ? `${c.value}%` : `฿${c.value.toLocaleString()}`}
                  </span>
                  <span className="mt-1 text-[11px] text-white/80">ส่วนลด</span>
                </div>
                <div className="min-w-0 flex-1 space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => copy(c.code)} title="คัดลอกโค้ด"
                      className="flex min-w-0 items-center gap-1.5 font-mono text-base font-bold tracking-wide hover:text-primary">
                      <span className="truncate">{c.code}</span> <Copy size={13} className="shrink-0 opacity-50" />
                    </button>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", state.tone)}>
                      {state.label}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {!c.isPublic && <span className="mr-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">โค้ดลับ</span>}
                    {c.description || c.label}
                  </p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {c.minOrder > 0 && <li>ขั้นต่ำ {priceFormat(c.minOrder)}</li>}
                    {c.maxDiscount != null && <li>ลดสูงสุด {priceFormat(c.maxDiscount)}</li>}
                    <li>
                      ต่อคน {c.perUserLimit ?? "ไม่จำกัด"} ครั้ง
                      {c.expiresAt && ` · หมดอายุ ${dateFormat(c.expiresAt)}`}
                    </li>
                  </ul>
                  {/* จำนวนที่ใช้ไป */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>ใช้ไป {c.used}{c.usageLimit ? ` / ${c.usageLimit}` : " ครั้ง"}</span>
                      {c.totalDiscount > 0 && <span className="text-muted-foreground">ลดไป {priceFormat(c.totalDiscount)}</span>}
                    </div>
                    {percentUsed != null && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentUsed}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <button onClick={() => toggle(c)} title={c.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      className={cn("rounded-lg p-2 hover:bg-muted", c.isActive ? "text-emerald-600" : "text-muted-foreground")}>
                      <Power size={16} />
                    </button>
                    <button onClick={() => setEditing(c)} title="แก้ไข"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => remove(c)} title="ลบ"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Coupons;
