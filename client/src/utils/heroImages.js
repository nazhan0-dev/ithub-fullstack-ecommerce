// รูปสไลด์หน้าแรก
// - ใส่ไฟล์รูป (.webp .jpg .jpeg .png) ไว้ใน src/assets/hero/ แล้วจะแสดงอัตโนมัติ ไม่ต้องแก้โค้ด
// - สุ่มลำดับใหม่ทุกครั้งที่เปิดหน้า: วนครบทุกรูปก่อนถึงจะซ้ำ และไม่เริ่มด้วยรูปเดียวกับครั้งก่อน
const files = import.meta.glob("../assets/hero/*.{webp,jpg,jpeg,png}", {
  eager: true,
  import: "default",
});

// คำอธิบายรูป (alt) ตามชื่อไฟล์ — รูปที่ไม่มีในรายการจะใช้คำอธิบายกลาง ๆ
const ALT = {
  ai: "ปัญญาประดิษฐ์ (AI)",
  "ai-data": "ข้อมูลและโมเดล AI",
  blockchain: "เครือข่ายบล็อกเชน",
  "data-center": "ศูนย์ข้อมูลและเซิร์ฟเวอร์",
  "vr-headset": "แว่น VR",
  "vr-experience": "ผู้ใช้งานแว่น VR",
  "robot-arm": "หุ่นยนต์อัจฉริยะ",
  "service-robot": "หุ่นยนต์บริการ",
  drone: "โดรนพร้อมกล้อง",
  laptop: "โน้ตบุ๊กรุ่นใหม่",
  smartwatch: "สมาร์ตวอทช์",
  smartphone: "สมาร์ตโฟนและหูฟังไร้สาย",
  cybersecurity: "ความปลอดภัยไซเบอร์",
  "automation-lab": "ห้องปฏิบัติการระบบอัตโนมัติ",
};

export const HERO_IMAGES = Object.entries(files).map(([path, src]) => {
  const name = path.split("/").pop().replace(/\.[^.]+$/, "");
  return { name, src, alt: ALT[name] || "ภาพเทคโนโลยี" };
});

const LAST_KEY = "hero-last-first";

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ลำดับรูปสำหรับการเปิดหน้าครั้งนี้ (อ่านอย่างเดียว — บันทึกรูปแรกด้วย rememberFirst หลังแสดงผลแล้ว)
export function getHeroOrder() {
  const order = shuffle(HERO_IMAGES);
  let last = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch {
    // เบราว์เซอร์ปิด localStorage -> ข้ามการจำรูปแรก
  }
  // ไม่ให้เริ่มด้วยรูปเดียวกับครั้งก่อน
  if (order.length > 1 && order[0].name === last) {
    const k = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[k]] = [order[k], order[0]];
  }
  return order;
}

// จำรูปแรกที่แสดงจริง เพื่อให้ครั้งหน้าเริ่มด้วยรูปอื่น
export function rememberFirst(image) {
  try {
    if (image) localStorage.setItem(LAST_KEY, image.name);
  } catch {
    // เบราว์เซอร์ปิด localStorage -> ไม่เป็นไร
  }
}
