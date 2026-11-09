import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Plus, Tags, Trash2 } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { createCategory, removeCategory } from "../../api/category";
import { PageHeader, Panel, inputClass } from "../../components/admin/AdminUI";
import { Button } from "@/components/ui/button";

const Category = () => {
  const categories = useEcomStore((state) => state.categories);
  const getCategory = useEcomStore((state) => state.getCategory);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategory();
  }, [getCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.warning("กรุณากรอกชื่อหมวดหมู่");
    setSaving(true);
    try {
      const res = await createCategory({ name: name.trim() });
      toast.success(`เพิ่มหมวดหมู่ ${res.data.name} เรียบร้อย`);
      setName("");
      getCategory();
    } catch (error) {
      console.log(error);
      toast.error("เพิ่มหมวดหมู่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (item) => {
    const result = await Swal.fire({
      title: `ลบหมวดหมู่ "${item.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      await removeCategory(item.id);
      toast.success(`ลบ ${item.name} เรียบร้อย`);
      getCategory();
    } catch (error) {
      console.log(error);
      toast.error("ลบไม่สำเร็จ (อาจมีสินค้าใช้หมวดหมู่นี้อยู่)");
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="หมวดหมู่สินค้า" description={`ทั้งหมด ${categories.length} หมวดหมู่`} />

      <Panel className="p-5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อหมวดหมู่ใหม่"
            className={inputClass}
          />
          <Button type="submit" disabled={saving} className="h-10 shrink-0 rounded-lg">
            <Plus /> เพิ่ม
          </Button>
        </form>

        <ul className="mt-5 divide-y">
          {categories.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                {index + 1}
              </span>
              <span className="flex-1 font-medium">{item.name}</span>
              <button
                onClick={() => handleRemove(item)}
                aria-label={`ลบ ${item.name}`}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        {categories.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Tags size={32} strokeWidth={1.5} />
            <p className="text-sm">ยังไม่มีหมวดหมู่</p>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default Category;
