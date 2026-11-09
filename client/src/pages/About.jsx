import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import useEcomStore from "../store/ecom-store";
import { listProduct } from "../api/product";
import { numberFormat } from "../utils/number";
import cover from "../assets/about-cover.jpg";

// ---- แก้ข้อความของร้านได้ที่นี่ ----
const STORY = [
  "IT Hub คือร้านค้าออนไลน์ที่รวบรวมอุปกรณ์ไอทีไว้ในที่เดียว ตั้งแต่คอมพิวเตอร์ โน้ตบุ๊ก ไปจนถึงอุปกรณ์เสริมอย่างเมาส์ คีย์บอร์ด และหูฟัง",
  "เราตั้งใจคัดสรรสินค้าคุณภาพในราคาที่เข้าถึงได้ พร้อมระบบสั่งซื้อที่ใช้งานง่าย ชำระเงินปลอดภัย และติดตามสถานะคำสั่งซื้อได้ตลอดเวลา",
];

const VALUES = [
  { icon: BadgeCheck, title: "คัดสรรสินค้าคุณภาพ", desc: "เลือกสินค้าที่ใช้งานได้จริงและคุ้มค่ากับราคา" },
  { icon: Truck, title: "จัดส่งฟรี", desc: "ไม่มีค่าจัดส่งเพิ่มสำหรับทุกคำสั่งซื้อ" },
  { icon: ShieldCheck, title: "ชำระเงินปลอดภัย", desc: "ชำระด้วยบัตรผ่านระบบ Stripe" },
  { icon: PackageSearch, title: "ติดตามคำสั่งซื้อได้", desc: "ดูสถานะคำสั่งซื้อได้ที่เมนูประวัติการสั่งซื้อ" },
];
// ------------------------------------

const About = () => {
  const categories = useEcomStore((state) => state.categories);
  const getCategory = useEcomStore((state) => state.getCategory);
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    getCategory();
    listProduct(1000)
      .then((res) => setProductCount(res.data.length))
      .catch((err) => console.log(err));
  }, [getCategory]);

  const stats = [
    { label: "สินค้าในร้าน", value: productCount === null ? "–" : numberFormat(productCount) },
    { label: "หมวดหมู่สินค้า", value: numberFormat(categories.length) },
    { label: "ค่าจัดส่ง", value: "฿0" },
  ];

  return (
    <div className="space-y-10">
      {/* ส่วนหัว */}
      <section className="relative overflow-hidden rounded-3xl">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/10" />
        <div className="relative max-w-xl space-y-3 px-8 py-16 text-white md:px-12 md:py-20">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            เกี่ยวกับเรา
          </span>
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
            ร้านอุปกรณ์ไอทีที่เข้าใจคนใช้งานจริง
          </h1>
          <p className="text-white/80">อุปกรณ์ไอทีครบ จบในที่เดียว</p>
        </div>
      </section>

      {/* เรื่องราว + ตัวเลข */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
          <h2 className="text-2xl font-bold tracking-tight">เรื่องราวของเรา</h2>
          {STORY.map((p) => (
            <p key={p} className="leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-primary/5 p-5 ring-1 ring-primary/10">
              <p className="text-2xl font-extrabold text-primary md:text-3xl">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* จุดเด่น */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">ทำไมต้อง IT Hub</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon size={24} />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* หมวดหมู่ที่มีขาย */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">สินค้าที่เรามีจำหน่าย</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/shop?category=${c.id}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium ring-1 ring-black/5 transition-colors hover:bg-secondary hover:text-secondary-foreground"
              >
                {c.name.trim()}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ชวนช้อป */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:p-10">
        <div>
          <h2 className="text-2xl font-bold">พร้อมเลือกอุปกรณ์ที่ใช่แล้วหรือยัง?</h2>
          <p className="text-white/80">ดูสินค้าทั้งหมดและเปรียบเทียบราคาได้เลย</p>
        </div>
        <Link
          to="/shop"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-primary transition-all hover:gap-3"
        >
          ไปที่ร้านค้า <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
};

export default About;
