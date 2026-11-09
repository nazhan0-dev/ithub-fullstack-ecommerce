import { useEffect } from "react";
import useEcomStore from "../../store/ecom-store";
import Uploadfile from "./Uploadfile";
import { FieldLabel, inputClass } from "./AdminUI";
import { Button } from "@/components/ui/button";

// ฟอร์มสินค้า ใช้ร่วมกันทั้งหน้าเพิ่มและแก้ไข
const ProductForm = ({ form, setForm, onSubmit, submitLabel, submitting, onCancel }) => {
  const categories = useEcomStore((state) => state.categories);
  const getCategory = useEcomStore((state) => state.getCategory);

  useEffect(() => {
    getCategory();
  }, [getCategory]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel htmlFor="title">ชื่อสินค้า</FieldLabel>
          <input id="title" name="title" required maxLength={255} value={form.title} onChange={handleChange}
            placeholder="เช่น MSI Gaming Laptop" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <FieldLabel htmlFor="description">รายละเอียด</FieldLabel>
          <textarea id="description" name="description" required rows={3} value={form.description}
            onChange={handleChange} placeholder="รายละเอียดสินค้า"
            className={`${inputClass} h-auto resize-none py-2`} />
        </div>
        <div>
          <FieldLabel htmlFor="price">ราคา (บาท)</FieldLabel>
          <input id="price" name="price" type="number" min="0" step="any" required value={form.price}
            onChange={handleChange} placeholder="0" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="quantity">จำนวนในสต็อก</FieldLabel>
          <input id="quantity" name="quantity" type="number" min="0" required value={form.quantity}
            onChange={handleChange} placeholder="0" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="lowStockThreshold">แจ้งเตือนเมื่อเหลือไม่เกิน (ชิ้น)</FieldLabel>
          <input id="lowStockThreshold" name="lowStockThreshold" type="number" min="0" required
            value={form.lowStockThreshold ?? 5} onChange={handleChange} className={inputClass} />
          <p className="mt-1 text-xs text-muted-foreground">ใส่ 0 = ไม่แจ้งเตือนสินค้านี้</p>
        </div>
        <div>
          <FieldLabel htmlFor="categoryId">หมวดหมู่</FieldLabel>
          <select id="categoryId" name="categoryId" required value={form.categoryId ?? ""}
            onChange={handleChange} className={inputClass}>
            <option value="" disabled>เลือกหมวดหมู่</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel>รูปภาพสินค้า</FieldLabel>
        <Uploadfile form={form} setForm={setForm} />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
            ยกเลิก
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="rounded-full px-6">
          {submitting ? "กำลังบันทึก..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
