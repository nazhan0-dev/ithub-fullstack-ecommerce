import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import logo from "../assets/logo.png";

const SEEN_KEY = "intro-seen";

// เล่นครั้งแรกที่เปิดเว็บในแท็บนี้เท่านั้น (รีเฟรช/เปลี่ยนหน้าไม่เล่นซ้ำ — ปิดแท็บแล้วเปิดใหม่ถึงเล่นอีก)
// อ่านอย่างเดียว — บันทึกว่าเล่นแล้วใน useEffect (StrictMode เรียก initializer 2 ครั้ง)
const alreadySeen = () => {
  try {
    return !!sessionStorage.getItem(SEEN_KEY);
  } catch {
    return false; // เบราว์เซอร์ปิด storage -> เล่นตามปกติ
  }
};
const markSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ไม่เป็นไร
  }
};

const DURATION = 1600; // ms ก่อนเปิดม่าน

// วงกลมเล็ก ๆ ลอยรอบโลโก้
const DOTS = [
  { x: -120, y: -70, size: 10, delay: 0.25 },
  { x: 130, y: -50, size: 14, delay: 0.35 },
  { x: -95, y: 80, size: 8, delay: 0.45 },
  { x: 115, y: 75, size: 11, delay: 0.3 },
  { x: 0, y: -110, size: 7, delay: 0.5 },
];

// แอนิเมชันเปิดเว็บ: โลโก้เด้งเข้า + แถบโหลด แล้วม่านเลื่อนขึ้นเผยหน้าเว็บ
const SplashIntro = () => {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(() => !reduceMotion && !alreadySeen());

  useEffect(() => {
    if (!show) return;
    markSeen();
    const t = setTimeout(() => setShow(false), DURATION);
    // ระหว่างเล่น ไม่ให้เลื่อนหน้าเว็บด้านหลัง
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          onClick={() => setShow(false)} // กดเพื่อข้าม
          exit={{ y: "-100%" }}
          transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[10000] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-white"
          aria-hidden="true"
        >
          {/* วงแสงม่วงขยายอยู่ด้านหลัง */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute size-[36rem] rounded-full bg-[radial-gradient(circle,var(--color-primary)_0%,transparent_65%)]"
          />

          <div className="relative">
            {DOTS.map((d, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: d.x, y: d.y, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 12, delay: d.delay }}
                className="absolute left-1/2 top-1/2 rounded-full bg-primary/70"
                style={{ width: d.size, height: d.size, marginLeft: -d.size / 2, marginTop: -d.size / 2 }}
              />
            ))}

            <motion.img
              src={logo}
              alt=""
              initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
              className="relative h-20 w-auto sm:h-24"
            />
          </div>

          {/* แถบโหลด */}
          <div className="relative mt-8 h-1 w-40 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: (DURATION - 300) / 1000, ease: "easeInOut", delay: 0.2 }}
              className="h-full origin-left rounded-full bg-primary"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashIntro;
