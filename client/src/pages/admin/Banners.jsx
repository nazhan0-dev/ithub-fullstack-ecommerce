import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Resizer from "react-image-file-resizer";
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { createBanner, deleteBanner, listAllBanners, updateBanner } from "../../api/banner";
import { listProduct } from "../../api/product";
import { uploadFiles } from "../../api/uploadfile";
import { removeFiles } from "../../api/removefile";
import { priceFormat } from "../../utils/number";
import { MAX_PER_DAY } from "../../utils/dailyBanners";
import { FieldLabel, PageHeader, Panel, inputClass } from "../../components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import FullImage from "../../components/FullImage";
import { cn } from "@/lib/utils";

const resizer = Resizer.default || Resizer;
// แบนเนอร์แสดงกว้าง -> ย่อให้ไม่เกิน 1600px (สัดส่วนเดิม)
const resizeBanner = (file) =>
  new Promise((resolve) => resizer.imageFileResizer(file, 1600, 1600, "JPEG", 85, 0, resolve, "base64"));

const emptyForm = { title: "", subtitle: "", productId: "", image: null };

const BannerForm = ({ editing, products, onSaved, onCancel }) => {
  const [form, setForm] = useState(
    editing
      ? {
          title: editing.title,
          subtitle: editing.subtitle || "",
          productId: editing.productId ?? "",
          image: { secure_url: editing.imageUrl, public_id: editing.publicId },
        }
      : emptyForm,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // รูปที่อัปขึ้นใหม่แต่ยังไม่บันทึก -> ยกเลิกแล้วต้องลบทิ้ง
  const [pendingUpload, setPendingUpload] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("ไฟล์นี้ไม่ใช่รูปภาพ");
    setUploading(true);
    try {
      const res = await uploadFiles(await resizeBanner(file));
      if (pendingUpload) removeFiles(pendingUpload).catch(() => {});
      setPendingUpload(res.data.public_id);
      setForm((f) => ({ ...f, image: { secure_url: res.data.secure_url, public_id: res.data.public_id } }));
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  const cancel = () => {
    if (pendingUpload) removeFiles(pendingUpload).catch(() => {});
    onCancel();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image) return toast.warning("กรุณาอัปโหลดรูปแบนเนอร์");
    setSaving(true);
    try {
      const payload = { ...form, image: pendingUpload || !editing ? form.image : undefined };
      const res = editing ? await updateBanner(editing.id, payload) : await createBanner(payload);
      toast.success(editing ? "บันทึกแบนเนอร์แล้ว" : "เพิ่มแบนเนอร์แล้ว");
      onSaved(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel className="mb-6 p-5">
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* รูป: สัดส่วน 5:2 เท่ากับที่แสดงบนหน้าแรก */}
        <div className="min-w-0">
          <FieldLabel>รูปแบนเนอร์</FieldLabel>
          <label
            className={cn(
              "relative flex aspect-[5/2] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/40 transition-colors hover:border-primary/50",
              form.image && "border-solid border-transparent",
            )}
          >
            {form.image ? (
              <>
                <FullImage src={form.image.secure_url} className="absolute inset-0" />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                  เปลี่ยนรูป
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <ImagePlus size={28} />
                เลือกรูป (แนะนำ 1600 × 640 px แนวนอน)
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 grid place-items-center bg-white/70">
                <Loader2 className="animate-spin text-primary" />
              </span>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
          <p className="mt-1.5 text-xs text-muted-foreground">
            ใช้รูปที่ร้านมีสิทธิ์ใช้ เช่น รูปจากตัวแทนจำหน่าย หรือรูปที่ถ่ายเอง
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <FieldLabel htmlFor="b-title">ชื่อแบนเนอร์</FieldLabel>
            <input id="b-title" required maxLength={120} value={form.title} onChange={set("title")}
              placeholder="เช่น iPhone 18 Pro มาแล้ว" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="b-sub">ข้อความรอง (ไม่บังคับ)</FieldLabel>
            <input id="b-sub" maxLength={200} value={form.subtitle} onChange={set("subtitle")}
              placeholder="เช่น สั่งจองวันนี้ ส่งฟรีทั่วประเทศ" className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="b-product">กดแล้วไปที่สินค้า</FieldLabel>
            <select id="b-product" value={form.productId} onChange={set("productId")} className={inputClass}>
              <option value="">— หน้าร้านค้า (ไม่ระบุสินค้า) —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} · {priceFormat(p.price)}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={cancel}>ยกเลิก</Button>
            <Button type="submit" disabled={saving || uploading} className="rounded-full px-6">
              {saving ? "กำลังบันทึก..." : editing ? "บันทึก" : "เพิ่มแบนเนอร์"}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
};

// หลังร้าน › แบนเนอร์หน้าแรก
const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = ปิดฟอร์ม, "new" = เพิ่ม, object = แก้ไข

  useEffect(() => {
    Promise.all([listAllBanners(), listProduct(500)])
      .then(([b, p]) => {
        setBanners(b.data);
        setProducts(p.data);
      })
      .catch(() => toast.error("โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const saved = (banner) => {
    setBanners((list) =>
      list.some((b) => b.id === banner.id) ? list.map((b) => (b.id === banner.id ? banner : b)) : [banner, ...list],
    );
    setEditing(null);
  };

  const toggle = async (banner) => {
    try {
      const res = await updateBanner(banner.id, { isActive: !banner.isActive });
      saved(res.data);
      toast.success(res.data.isActive ? "แสดงบนหน้าแรกแล้ว" : "ซ่อนจากหน้าแรกแล้ว");
    } catch {
      toast.error("เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const remove = async (banner) => {
    const ok = await Swal.fire({
      title: "ลบแบนเนอร์นี้?",
      text: banner.title,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!ok.isConfirmed) return;
    try {
      await deleteBanner(banner.id);
      setBanners((list) => list.filter((b) => b.id !== banner.id));
      toast.success("ลบแบนเนอร์แล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div>
      <PageHeader
        title="แบนเนอร์หน้าแรก"
        description={`เปิดใช้งาน ${activeCount} จาก ${banners.length} · หน้าแรกสุ่มลำดับใหม่ทุกวัน แสดงวันละไม่เกิน ${MAX_PER_DAY} รูป`}
        action={
          !editing && (
            <Button onClick={() => setEditing("new")} className="rounded-full">
              <Plus /> เพิ่มแบนเนอร์
            </Button>
          )
        }
      />

      {editing && (
        <BannerForm
          key={editing === "new" ? "new" : editing.id}
          editing={editing === "new" ? null : editing}
          products={products}
          onSaved={saved}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="aspect-[5/3] animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : banners.length === 0 ? (
        <Panel className="py-14 text-center text-sm text-muted-foreground">
          ยังไม่มีแบนเนอร์ — หน้าแรกจะแสดงรูปเทคโนโลยีทั่วไปแทน
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((b) => (
            <Panel key={b.id} className={cn("overflow-hidden", !b.isActive && "opacity-60")}>
              <div className="relative aspect-[5/2] bg-muted">
                <FullImage src={b.imageUrl} alt={b.title} />
                <span
                  className={cn(
                    "absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    b.isActive ? "bg-emerald-500 text-white" : "bg-zinc-700 text-white",
                  )}
                >
                  {b.isActive ? "แสดงอยู่" : "ซ่อน"}
                </span>
              </div>
              <div className="space-y-1 p-4">
                <p className="truncate font-semibold">{b.title}</p>
                <p className="truncate text-xs text-muted-foreground">{b.subtitle || "—"}</p>
                <p className="truncate text-xs">
                  ลิงก์: <span className="text-primary">{b.product ? b.product.title : "หน้าร้านค้า"}</span>
                </p>
              </div>
              <div className="flex justify-end gap-1 border-t px-3 py-2">
                <button onClick={() => toggle(b)} title={b.isActive ? "ซ่อน" : "แสดง"}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  {b.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => setEditing(b)} title="แก้ไข"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(b)} title="ลบ"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};

export default Banners;
