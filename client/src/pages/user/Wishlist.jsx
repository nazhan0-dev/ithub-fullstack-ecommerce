import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { getWishlist } from "../../api/user";
import useEcomStore from "../../store/ecom-store";
import ProductCard from "../../components/card/ProductCard";
import { Button } from "@/components/ui/button";

// รายการโปรด: สินค้าที่ผู้ใช้กดหัวใจไว้
const Wishlist = () => {
  const wishlist = useEcomStore((s) => s.wishlist);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWishlist()
      .then((res) => setProducts(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  // กดหัวใจออกในหน้านี้ -> การ์ดหายไปทันที
  const shown = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">รายการโปรด</h1>
        {!loading && <p className="text-sm text-muted-foreground">{shown.length} รายการ</p>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm ring-1 ring-black/5">
          <Heart size={44} strokeWidth={1.5} className="text-rose-400" />
          <div>
            <p className="font-semibold">ยังไม่มีรายการโปรด</p>
            <p className="text-sm text-muted-foreground">กดรูปหัวใจบนสินค้าที่ชอบ เพื่อเก็บไว้ดูภายหลัง</p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/shop">ไปเลือกสินค้า</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {shown.map((item, i) => (
            <ProductCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
