import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { cn } from "@/lib/utils";

// แถบหมวดหมู่แบบ pill (ใช้ทั้งหน้าแรกและหน้าร้านค้า)
// หมวดหมู่ล้นจอ -> ขอบจางลง + ปุ่มลูกศรเลื่อนซ้าย/ขวา (จอคอม) / ปัดเลื่อน (มือถือ)
const CategoryChips = ({ selected = [], onToggle, onClear }) => {
  const categories = useEcomStore((state) => state.categories);
  const getCategory = useEcomStore((state) => state.getCategory);
  const scroller = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    getCategory();
  }, [getCategory]);

  // เช็กว่ายังเลื่อนไปซ้าย/ขวาได้อีกไหม
  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update, categories.length]);

  const scrollBy = (dir) => {
    const el = scroller.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const chip = (active) =>
    cn(
      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-white text-foreground ring-1 ring-black/5 hover:bg-secondary hover:text-secondary-foreground",
    );

  const arrow = (dir) => {
    const show = dir < 0 ? edges.left : edges.right;
    const Icon = dir < 0 ? ChevronLeft : ChevronRight;
    return (
      <>
        {/* ขอบจาง บอกว่ายังมีหมวดหมู่ซ่อนอยู่ */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 z-10 w-16 from-background to-transparent transition-opacity duration-200",
            dir < 0 ? "-left-4 bg-gradient-to-r" : "-right-4 bg-gradient-to-l",
            show ? "opacity-100" : "opacity-0",
          )}
        />
        <button
          type="button"
          onClick={() => scrollBy(dir)}
          aria-label={dir < 0 ? "เลื่อนหมวดหมู่ไปทางซ้าย" : "เลื่อนหมวดหมู่ไปทางขวา"}
          tabIndex={show ? 0 : -1}
          className={cn(
            "absolute top-1/2 z-20 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-foreground shadow-md ring-1 ring-black/5 transition-all duration-200 hover:bg-secondary hover:text-primary md:grid",
            dir < 0 ? "left-0" : "right-0",
            show ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
          )}
        >
          <Icon size={18} />
        </button>
      </>
    );
  };

  return (
    <div className="relative">
      {arrow(-1)}
      <div ref={scroller} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto scroll-smooth px-4 py-1">
        <button className={chip(selected.length === 0)} onClick={onClear}>
          ทุกหมวดหมู่
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            className={chip(selected.includes(String(item.id)))}
            onClick={() => onToggle(String(item.id))}
          >
            {item.name}
          </button>
        ))}
      </div>
      {arrow(1)}
    </div>
  );
};

export default CategoryChips;
