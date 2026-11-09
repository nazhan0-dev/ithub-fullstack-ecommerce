import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ArrowRight } from "lucide-react";
import banner1 from "../../assets/banners/banner-1.jpg";
import banner2 from "../../assets/banners/banner-2.jpg";
import banner3 from "../../assets/banners/banner-3.jpg";
import banner4 from "../../assets/banners/banner-4.jpg";
import banner5 from "../../assets/banners/banner-5.jpg";
import banner6 from "../../assets/banners/banner-6.jpg";

// รูปแบนเนอร์จาก Unsplash (ใช้ได้ฟรีตาม Unsplash License) เก็บไว้ในโปรเจกต์ ไม่ต้องโหลดจากภายนอก
const BANNERS = [
  { src: banner1, alt: "โน้ตบุ๊กพร้อมไฟคีย์บอร์ดโทนม่วง" },
  { src: banner2, alt: "ชุดคอมพิวเตอร์เกมมิ่งพร้อมจอและคีย์บอร์ด RGB" },
  { src: banner3, alt: "การ์ดจอประสิทธิภาพสูง" },
  { src: banner4, alt: "โต๊ะทำงานพร้อมคอมพิวเตอร์ในแสงไฟสีชมพู" },
  { src: banner5, alt: "ซีพียูบนเมนบอร์ด" },
  { src: banner6, alt: "แผงวงจรอิเล็กทรอนิกส์" },
];

const ContentCarousel = () => {
  return (
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
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        className="h-64 w-full min-w-0 overflow-hidden rounded-3xl bg-muted md:h-80 lg:col-span-2"
      >
        {BANNERS.map((b) => (
          <SwiperSlide key={b.src}>
            <img src={b.src} alt={b.alt} className="h-full w-full object-cover" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ContentCarousel;
