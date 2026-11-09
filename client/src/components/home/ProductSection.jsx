import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SwiperSlide } from "swiper/react";
import { ArrowRight } from "lucide-react";
import { listProductBy } from "../../api/product";
import ProductCard from "../card/ProductCard";
import SwiperShowProduct from "../../utils/SwiperShowProduct";

// ส่วนแสดงสินค้าบนหน้าแรก (ใช้ร่วมกันทั้ง "ขายดี" และ "สินค้าใหม่")
const ProductSection = ({ title, subtitle, sort, order = "desc", limit = 12 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProductBy(sort, order, limit)
      .then((res) => setData(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [sort, order, limit]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          to="/shop"
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          ดูทั้งหมด <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="rounded-2xl bg-white py-10 text-center text-muted-foreground">
          ยังไม่มีสินค้า
        </p>
      ) : (
        <SwiperShowProduct>
          {data.map((el) => (
            <SwiperSlide key={el.id} className="!h-auto">
              <ProductCard item={el} />
            </SwiperSlide>
          ))}
        </SwiperShowProduct>
      )}
    </section>
  );
};

export default ProductSection;
