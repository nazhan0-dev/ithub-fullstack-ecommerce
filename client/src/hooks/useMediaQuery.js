import { useSyncExternalStore } from "react";

// true เมื่อหน้าจอตรงกับ media query (อัปเดตเองตอนย่อ/ขยายหน้าต่าง)
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
