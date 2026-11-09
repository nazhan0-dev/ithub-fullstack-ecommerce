export const ORDER_STATUSES = ["Not Process", "Processing", "Completed", "Cancelled"];

export const STATUS_LABELS = {
  "Not Process": "รอดำเนินการ",
  Processing: "กำลังดำเนินการ",
  Completed: "สำเร็จ",
  Cancelled: "ยกเลิก",
};

// เลขที่คำสั่งซื้อสำหรับแสดงผล: 20 -> "ORD-00020" (ใน DB ยังเป็น id ตัวเลขเหมือนเดิม)
export const orderCode = (id) => `ORD-${String(id).padStart(5, "0")}`;

// แปลงคำค้นหาเป็น id: "ORD-00020", "#20", "20" -> 20
export const parseOrderCode = (text) => {
  const m = String(text).trim().match(/^#?(?:ord-?)?0*(\d+)$/i);
  return m ? Number(m[1]) : null;
};
