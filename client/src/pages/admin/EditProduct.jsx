import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Loader2 } from "lucide-react";
import { readProduct, updateProduct } from "../../api/product";
import ProductForm from "../../components/admin/ProductForm";
import { emptyProduct } from "../../utils/product";
import { PageHeader, Panel } from "../../components/admin/AdminUI";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    readProduct(id)
      .then((res) =>
        setForm({
          ...emptyProduct,
          ...res.data,
          categoryId: res.data.categoryId ?? "",
          images: res.data.images || [],
        }),
      )
      .catch((err) => {
        console.log(err);
        toast.error("ไม่พบสินค้า");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProduct(id, form);
      toast.success("บันทึกการแก้ไขเรียบร้อย");
      navigate("/admin/product");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "แก้ไขสินค้าไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        to="/admin/product"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft size={16} /> กลับไปหน้าสินค้า
      </Link>
      <PageHeader title="แก้ไขสินค้า" description={form.title} />

      <Panel className="p-6">
        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <ProductForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="บันทึกการแก้ไข"
            onCancel={() => navigate("/admin/product")}
          />
        )}
      </Panel>
    </div>
  );
};

export default EditProduct;
