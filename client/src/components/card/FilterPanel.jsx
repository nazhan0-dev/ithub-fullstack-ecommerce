import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { priceFormat } from "../../utils/number";
import { Slider } from "@/components/ui/slider";

export const PRICE_MIN = 0;
export const PRICE_MAX = 100000;

const Section = ({ title, action, children }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const ResetButton = ({ onClick, show }) =>
  show ? (
    <button onClick={onClick} className="text-xs text-muted-foreground hover:text-primary">
      ล้างค่า
    </button>
  ) : null;

// แผงตัวกรองด้านซ้ายของหน้าร้านค้า
const FilterPanel = ({ categorySelected, onToggleCategory, onClearCategory, price, onPriceCommit }) => {
  const categories = useEcomStore((state) => state.categories);
  const [localPrice, setLocalPrice] = useState(price);
  const priceKey = price.join("-");
  const [prevPriceKey, setPrevPriceKey] = useState(priceKey);

  // sync เมื่อค่าใน URL เปลี่ยน (เช่น กดล้างค่า)
  if (priceKey !== prevPriceKey) {
    setPrevPriceKey(priceKey);
    setLocalPrice(price);
  }

  const priceChanged = price[0] !== PRICE_MIN || price[1] !== PRICE_MAX;

  return (
    <aside className="space-y-4">
      <div className="hidden items-center gap-2 px-1 text-lg font-bold lg:flex">
        <SlidersHorizontal size={20} /> ตัวกรอง
      </div>

      <Section
        title="ช่วงราคา"
        action={
          <ResetButton show={priceChanged} onClick={() => onPriceCommit([PRICE_MIN, PRICE_MAX])} />
        }
      >
        <div className="mb-5 mt-2 flex justify-between text-sm">
          <span className="rounded-full bg-foreground px-3 py-1 font-semibold text-background">
            {priceFormat(localPrice[0])}
          </span>
          <span className="rounded-full bg-foreground px-3 py-1 font-semibold text-background">
            {priceFormat(localPrice[1])}
          </span>
        </div>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={500}
          value={localPrice}
          onValueChange={setLocalPrice}
          onValueCommit={onPriceCommit}
          className="px-1"
        />
      </Section>

      <Section
        title="หมวดหมู่"
        action={<ResetButton show={categorySelected.length > 0} onClick={onClearCategory} />}
      >
        <div className="space-y-1">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีหมวดหมู่</p>
          )}
          {categories.map((item) => {
            const id = String(item.id);
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span>{item.name}</span>
                <input
                  type="checkbox"
                  checked={categorySelected.includes(id)}
                  onChange={() => onToggleCategory(id)}
                  className="size-4 cursor-pointer accent-primary"
                />
              </label>
            );
          })}
        </div>
      </Section>
    </aside>
  );
};

export default FilterPanel;
