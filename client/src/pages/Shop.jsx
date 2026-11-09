import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import useEcomStore from "../store/ecom-store";
import ProductCard from "../components/card/ProductCard";
import FilterPanel, { PRICE_MAX, PRICE_MIN } from "../components/card/FilterPanel";
import CategoryChips from "../components/home/CategoryChips";

const Shop = () => {
  const getProduct = useEcomStore((state) => state.getProduct);
  const actionSearchFilters = useEcomStore((state) => state.actionSearchFilters);
  const products = useEcomStore((state) => state.products);
  const [showFilter, setShowFilter] = useState(false);

  // ตัวกรองทั้งหมดเก็บใน URL -> แชร์ลิงก์ได้ และช่องค้นหาบน navbar ใช้ร่วมกันได้
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const categoryParam = params.get("category") || "";
  const categorySelected = categoryParam ? categoryParam.split(",") : [];
  const minPrice = Number(params.get("min") ?? PRICE_MIN);
  const maxPrice = Number(params.get("max") ?? PRICE_MAX);
  const priceActive = minPrice !== PRICE_MIN || maxPrice !== PRICE_MAX;

  // loading = ผลลัพธ์ล่าสุดยังไม่ตรงกับตัวกรองปัจจุบัน
  const filterKey = [query, categoryParam, minPrice, maxPrice].join("|");
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== filterKey;

  useEffect(() => {
    const hasFilter = query || categorySelected.length > 0 || priceActive;
    const request = hasFilter
      ? actionSearchFilters({
          query: query || undefined,
          category: categorySelected.length > 0 ? categorySelected : undefined,
          price: priceActive ? [minPrice, maxPrice] : undefined,
        })
      : getProduct(100);
    request.finally(() => setLoadedKey(filterKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  };

  const toggleCategory = (id) => {
    const next = categorySelected.includes(id)
      ? categorySelected.filter((c) => c !== id)
      : [...categorySelected, id];
    updateParams({ category: next.join(",") });
  };

  const handlePrice = ([min, max]) => {
    updateParams({
      min: min === PRICE_MIN ? undefined : min,
      max: max === PRICE_MAX ? undefined : max,
    });
  };

  return (
    <div className="space-y-5">
      <CategoryChips
        selected={categorySelected}
        onToggle={toggleCategory}
        onClear={() => updateParams({ category: undefined })}
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div>
          {/* มือถือ: ซ่อนตัวกรองไว้หลังปุ่ม */}
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-black/5 lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} /> ตัวกรอง
              {(categorySelected.length > 0 || priceActive) && (
                <span className="size-2 rounded-full bg-primary" />
              )}
            </span>
            <ChevronDown size={16} className={showFilter ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          <div className={showFilter ? "mt-4 lg:mt-0" : "hidden lg:block"}>
            <FilterPanel
              categorySelected={categorySelected}
              onToggleCategory={toggleCategory}
              onClearCategory={() => updateParams({ category: undefined })}
              price={[minPrice, maxPrice]}
              onPriceCommit={handlePrice}
            />
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {query ? `ผลการค้นหา “${query}”` : "สินค้าทั้งหมด"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {query && (
                <button
                  onClick={() => updateParams({ q: undefined })}
                  className="flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-black/5 hover:text-primary"
                >
                  ล้างคำค้นหา <X size={14} />
                </button>
              )}
              <span>{products.length} รายการ</span>
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-20 text-center text-muted-foreground">
              <PackageSearch size={48} strokeWidth={1.5} />
              <p>ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
              <button
                onClick={() => setParams({}, { replace: true })}
                className="text-sm font-semibold text-primary hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 xl:grid-cols-4 ${
                loading ? "opacity-60" : ""
              }`}
            >
              {products.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Shop;
