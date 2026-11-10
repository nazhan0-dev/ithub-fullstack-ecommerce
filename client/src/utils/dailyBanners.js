// เลือกแบนเนอร์ประจำวัน: ลำดับเปลี่ยนทุกวัน (ทุกคนเห็นชุดเดียวกันในวันเดียวกัน)
// - มีแบนเนอร์มากกว่า MAX -> แต่ละวันได้ชุดไม่เหมือนกัน
// - รูปแรกของวันนี้ไม่ซ้ำกับรูปแรกของเมื่อวาน
export const MAX_PER_DAY = 6;

// วันที่ตามเวลาไทย เช่น "2026-11-09"
const dayKey = (date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

// ตัวสุ่มที่ได้ผลเหมือนเดิมเมื่อ seed เดิม (mulberry32)
const seeded = (seedText) => {
  let a = [...seedText].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 7);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleFor = (list, key) => {
  const rand = seeded(key);
  const a = [...list].sort((x, y) => String(x.id).localeCompare(String(y.id), "en", { numeric: true }));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function dailyBanners(banners, now = new Date()) {
  const today = shuffleFor(banners, dayKey(now));
  const yesterday = shuffleFor(banners, dayKey(new Date(now.getTime() - 86400000)));
  if (today.length > 1 && today[0].id === yesterday[0].id) {
    today.push(today.shift()); // เลื่อนรูปแรกไปท้ายสุด
  }
  return today.slice(0, MAX_PER_DAY);
}
