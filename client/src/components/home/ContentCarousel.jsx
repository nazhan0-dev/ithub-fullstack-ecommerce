import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ArrowRight } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { getHeroOrder, rememberFirst } from "../../utils/heroImages";
import { listBanners } from "../../api/banner";
import { listProductBy } from "../../api/product";
import { dailyBanners } from "../../utils/dailyBanners";
import { priceFormat } from "../../utils/number";

// สไลด์สินค้าติดกระแส: รูป + ชื่อ + ราคา + ปุ่มไปหน้าสินค้า
// ข้อความไล่ขึ้นมาทีละบรรทัดเมื่อสไลด์ถูกเลื่อนมาแสดง
const textItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

// active: สไลด์นี้กำลังแสดงอยู่ (ได้จาก Swiper) -> เล่นแอนิเมชันใหม่ทุกครั้งที่เลื่อนมาถึง
const PromoSlide = ({ banner, eager, active }) => {
  const to = banner.product ? `/product/${banner.product.id}` : "/shop";
  const state = active ? "show" : "hidden";
  return (
    <Link
      to={to}
      className="group relative flex h-full w-full items-center overflow-hidden bg-gradient-to-br from-violet-200 via-indigo-100 to-fuchsia-200"
    >
      {/* แสงขาวด้านหลังสินค้า (สีสินค้าไม่เพี้ยนตามพื้นม่วง) — หายใจเข้าออกช้า ๆ */}
      <motion.span
        animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-12%] top-1/2 size-80 -translate-y-1/2 rounded-full bg-white blur-2xl md:right-[4%] md:size-[26rem]"
      />
      {/* วงแสงสีลอยไปมา */}
      <motion.span
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-16 -top-20 size-64 rounded-full bg-primary/25 blur-3xl"
      />
      <motion.span
        animate={{ x: [0, -50, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-24 left-[30%] size-56 rounded-full bg-fuchsia-300/40 blur-3xl"
      />

      {/* รูปสินค้า: ลอยเข้าจากขวา แล้วลอยขึ้นลงเบา ๆ — พื้นขาวของรูปกลืนกับพื้นหลัง (mix-blend-multiply) */}
      <div className="absolute inset-y-0 right-0 flex w-[48%] items-center justify-center p-3 md:w-[52%] md:p-6">
        <motion.div
          initial={false}
          animate={
            active
              ? { opacity: 1, x: 0, rotate: 0, scale: 1 }
              : { opacity: 0, x: 60, rotate: 6, scale: 0.9 }
          }
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 16,
            delay: active ? 0.1 : 0,
          }}
          // mix-blend ต้องอยู่ชั้นนอกสุด: transform ของแอนิเมชันสร้างชั้นแยก ถ้าใส่ที่ <img> จะกลืนกับพื้นหลังไม่ได้
          className="flex h-full w-full items-center justify-center mix-blend-multiply"
        >
          <motion.img
            src={banner.imageUrl}
            alt={banner.title}
            loading={eager ? "eager" : "lazy"}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:-rotate-2 group-hover:scale-105"
          />
        </motion.div>
      </div>

      {/* ข้อความ */}
      <motion.div
        initial={false}
        animate={state}
        variants={{
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          hidden: {},
        }}
        className="relative z-10 flex w-[56%] flex-col items-start gap-2 p-5 md:w-1/2 md:gap-3 md:p-10"
      >
        <motion.h2
          variants={textItem}
          className="line-clamp-2 text-2xl font-extrabold leading-tight text-foreground md:text-4xl"
        >
          {banner.title}
        </motion.h2>
        {banner.subtitle && (
          <motion.p
            variants={textItem}
            className="line-clamp-2 text-sm text-muted-foreground md:text-base"
          >
            {banner.subtitle}
          </motion.p>
        )}
        {banner.product && (
          <motion.p
            variants={textItem}
            className="text-lg font-extrabold text-primary md:text-2xl"
          >
            {priceFormat(banner.product.price)}
          </motion.p>
        )}
        <motion.span
          variants={textItem}
          className="relative mt-1 inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-[gap] group-hover:gap-3 md:px-5 md:py-2.5"
        >
          {/* แสงวิ่งผ่านปุ่ม */}
          <motion.span
            animate={{ x: ["-120%", "220%"] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: "easeInOut",
            }}
            className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
          <span className="relative">
            {banner.product ? "ดูสินค้า" : "เลือกซื้อสินค้า"}
          </span>
          <ArrowRight size={16} className="relative" />
        </motion.span>
      </motion.div>
    </Link>
  );
};

const ContentCarousel = () => {
  // สุ่มลำดับครั้งเดียวต่อการเปิดหน้า (ไม่สุ่มใหม่ทุกครั้งที่ render)
  const [banners] = useState(getHeroOrder);

  // สไลด์ (null = กำลังโหลด) เลือกตามลำดับ:
  // 1) แบนเนอร์ที่ admin ตั้งไว้  2) ไม่มี -> สินค้าขายดีในร้าน (แสดงแบบเดียวกัน)  3) ไม่มีสินค้า -> รูปเทคโนโลยี
  const [promos, setPromos] = useState(null);

  useEffect(() => {
    const fromBestSellers = () =>
      listProductBy("sold", "desc", 12).then((res) =>
        res.data
          .filter((p) => p.images?.length > 0)
          .map((p) => ({
            id: `p${p.id}`,
            title: p.title,
            subtitle: p.category?.name
              ? `ขายดีในหมวด ${p.category.name.trim()}`
              : "สินค้าขายดี",
            imageUrl: p.images[0].secure_url || p.images[0].url,
            product: { id: p.id, price: p.price },
          })),
      );
    listBanners()
      .then((res) => (res.data.length > 0 ? res.data : fromBestSellers()))
      .then((list) => setPromos(dailyBanners(list)))
      .catch(() => setPromos([]));
  }, []);

  const usePromos = promos?.length > 0;
  useEffect(() => {
    if (promos && !usePromos) rememberFirst(banners[0]);
  }, [promos, usePromos, banners]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hero ข้อความ */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 size-48 rounded-full bg-white/10" />
          <div className="relative space-y-3">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              โปรโมชันประจำเดือน
            </span>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
              อุปกรณ์ไอทีครบ จบในที่เดียว
            </h1>
            <p className="text-sm text-white/80">
              คัดสรรสินค้าคุณภาพ ราคาคุ้มค่า พร้อมจัดส่งทั่วประเทศ
            </p>
          </div>
          <Link
            to="/shop"
            className="relative mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:gap-3"
          >
            เลือกซื้อสินค้า <ArrowRight size={16} />
          </Link>
        </div>

        {/* รูปสไลด์ */}
        {promos === null ? (
          <div className="h-64 w-full animate-pulse rounded-3xl bg-muted md:h-80 lg:col-span-2" />
        ) : (
          <Swiper
            key={usePromos ? "promos" : "hero"}
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            loop
            className="h-64 w-full min-w-0 overflow-hidden rounded-3xl bg-muted shadow-lg shadow-primary/10 ring-1 ring-primary/10 md:h-80 lg:col-span-2"
          >
            {usePromos
              ? promos.map((b, i) => (
                  <SwiperSlide key={b.id}>
                    {({ isActive }) => (
                      <PromoSlide
                        banner={b}
                        eager={i === 0}
                        active={isActive}
                      />
                    )}
                  </SwiperSlide>
                ))
              : banners.map((b, i) => (
                  <SwiperSlide key={b.name}>
                    <img
                      src={b.src}
                      alt={b.alt}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="h-full w-full object-cover"
                    />
                  </SwiperSlide>
                ))}
          </Swiper>
        )}
      </div>
    </MotionConfig>
  );
};

export default ContentCarousel;
