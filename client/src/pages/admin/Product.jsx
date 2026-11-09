import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ImageOff, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { createProduct, deleteProduct } from "../../api/product";
import { priceFormat } from "../../utils/number";
import { dateFormat } from "../../utils/dateformat";
import ProductForm from "../../components/admin/ProductForm";
import { emptyProduct } from "../../utils/product";
import { PageHeader, Panel } from "../../components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ป้ายจำนวนคงเหลือ: หมด = แดง, ใกล้หมด (≤5) = เหลือง
const StockPill = ({ qty }) => (
  <span
    className={cn(
      "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
      qty <= 0 ? "bg-red-100 text-red-700" : qty <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
    )}
  >
    {qty <= 0 ? "หมด" : qty}
  </span>
);

const Product = () => {
  const getProduct = useEcomStore((state) => state.getProduct);
  const products = useEcomStore((state) => state.products);
  const categories = useEcomStore((state) => state.categories);
  const getCategory = useEcomStore((state) => state.getCategory);

  const [form, setForm] = useState(emptyProduct);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  useEffect(() => {
    getProduct(100);
    getCategory();
  }, [getProduct, getCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createProduct(form);
      toast.success(`เพิ่มสินค้า ${res.data.title} เรียบร้อย`);
      setForm(emptyProduct);
      setShowForm(false);
      getProduct(100);
    } catch (error) {
      console.log(error);
      toast.error("เพิ่มสินค้าไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `"${item.title}" จะถูกลบถาวร`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteProduct(item.id);
      toast.success("ลบสินค้าเรียบร้อย");
      getProduct(100);
    } catch (error) {
      console.log(error);
      toast.error("ลบสินค้าไม่สำเร็จ");
    }
  };

  const q = keyword.trim().toLowerCase();
  const lowCount = products.filter((p) => p.quantity <= 5).length;
  const filtered = products
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    .filter((p) => categoryFilter === "all" || String(p.categoryId) === categoryFilter)
    .filter((p) => stockFilter === "all" || (stockFilter === "low" ? p.quantity <= 5 : p.quantity <= 0));

  return (
    <div>
      <PageHeader
        title="สินค้า"
        description={`ทั้งหมด ${products.length} รายการ`}
        action={
          <Button onClick={() => setShowForm((v) => !v)} className="rounded-full">
            {showForm ? <X /> : <Plus />} {showForm ? "ปิดฟอร์ม" : "เพิ่มสินค้า"}
          </Button>
        }
      />

      {showForm && (
        <Panel className="mb-6 p-6">
          <h2 className="mb-4 text-lg font-bold">เพิ่มสินค้าใหม่</h2>
          <ProductForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="เพิ่มสินค้า"
            onCancel={() => setShowForm(false)}
          />
        </Panel>
      )}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาชื่อหรือรายละเอียดสินค้า..."
              className="h-9 w-full rounded-full bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="กรองตามหมวดหมู่"
              className="h-9 flex-1 rounded-full border bg-white px-3 text-sm md:flex-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name.trim()}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              aria-label="กรองตามสต็อก"
              className="h-9 flex-1 rounded-full border bg-white px-3 text-sm md:flex-none"
            >
              <option value="all">ทุกสถานะสต็อก</option>
              <option value="low">ใกล้หมด (≤ 5) · {lowCount}</option>
              <option value="out">หมดแล้ว</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground md:ml-auto">แสดง {filtered.length} จาก {products.length}</p>
        </div>

        {/* มือถือ: แสดงเป็นการ์ด */}
        <ul className="divide-y md:hidden">
          {filtered.map((item) => (
            <li key={item.id} className="flex gap-3 p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.images?.length > 0 ? (
                  <img src={item.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageOff size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-sm font-semibold text-primary">{priceFormat(item.price)}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <StockPill qty={item.quantity} />
                  {item.category?.name && <span>{item.category.name.trim()}</span>}
                  <span>· ขายแล้ว {item.sold}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Link to={`/admin/product/${item.id}`} aria-label="แก้ไข"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary">
                  <Pencil size={16} />
                </Link>
                <button onClick={() => handleDelete(item)} aria-label="ลบ"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">สินค้า</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 text-right font-semibold">ราคา</th>
                <th className="px-4 py-3 text-center font-semibold">คงเหลือ</th>
                <th className="px-4 py-3 text-right font-semibold">ขายแล้ว</th>
                <th className="px-4 py-3 font-semibold">อัปเดต</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.images?.length > 0 ? (
                          <img src={item.images[0].url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <ImageOff size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-xs truncate font-medium">{item.title}</p>
                        <p className="max-w-xs truncate text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.category?.name ? (
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {item.category.name.trim()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{priceFormat(item.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <StockPill qty={item.quantity} />
                  </td>
                  <td className="px-4 py-3 text-right">{item.sold}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{dateFormat(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/admin/product/${item.id}`}
                        aria-label="แก้ไข"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(item)}
                        aria-label="ลบ"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">ไม่พบสินค้า</p>
        )}
      </Panel>
    </div>
  );
};

export default Product;
