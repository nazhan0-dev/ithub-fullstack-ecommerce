import { useEffect } from "react";
import useEcomStore from "../../store/ecom-store";
import { cn } from "@/lib/utils";

// แถบหมวดหมู่แบบ pill (ใช้ทั้งหน้าแรกและหน้าร้านค้า)
const CategoryChips = ({ selected = [], onToggle, onClear }) => {
  const categories = useEcomStore((state) => state.categories);
  const getCategory = useEcomStore((state) => state.getCategory);

  useEffect(() => {
    getCategory();
  }, [getCategory]);

  const chip = (active) =>
    cn(
      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-white text-foreground ring-1 ring-black/5 hover:bg-secondary hover:text-secondary-foreground",
    );

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
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
  );
};

export default CategoryChips;
