import moment from "moment";

export function dateFormat(date) {
  return moment(date).format("D MMM YYYY");
}

// เวลาแบบ "x นาทีที่แล้ว" (ใช้ในรายการแจ้งเตือน)
export function timeAgo(date) {
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} วันที่แล้ว`;
  return dateFormat(date);
}
