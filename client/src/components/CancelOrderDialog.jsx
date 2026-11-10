import { AlertDialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, PackageX, Undo2 } from "lucide-react";
import { priceFormat } from "../utils/number";
import { orderCode } from "../utils/orderStatus";

// หน้าต่างยืนยันยกเลิกคำสั่งซื้อ (แทน SweetAlert ให้เข้ากับดีไซน์เว็บ)
// order: คำสั่งซื้อที่จะยกเลิก (null = ปิด) — ปิดไม่ได้ระหว่างกำลังยกเลิก
const CancelOrderDialog = ({ order, busy, onConfirm, onClose }) => {
  const open = !!order;
  const items = order?.products || [];

  return (
    <AlertDialog.Root open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </AlertDialog.Overlay>
            <AlertDialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                <div className="space-y-5 p-6 sm:p-7">
                  {/* หัว */}
                  <div className="flex items-start gap-4">
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.08 }}
                      className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100"
                    >
                      <PackageX size={24} />
                    </motion.span>
                    <div className="min-w-0 space-y-1">
                      <AlertDialog.Title className="text-lg font-bold leading-tight">ยกเลิกคำสั่งซื้อนี้?</AlertDialog.Title>
                      <AlertDialog.Description className="text-sm text-muted-foreground">
                        เมื่อยกเลิกแล้วจะย้อนกลับไม่ได้
                      </AlertDialog.Description>
                    </div>
                  </div>

                  {/* สรุปคำสั่งซื้อ */}
                  {order && (
                    <div className="space-y-3 rounded-2xl bg-muted/50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">คำสั่งซื้อ</span>
                        <span className="font-mono font-semibold">#{orderCode(order.id)}</span>
                      </div>
                      <ul className="space-y-1 text-sm">
                        {items.slice(0, 3).map((item) => (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span className="truncate">{item.product?.title}</span>
                            <span className="shrink-0 text-muted-foreground">× {item.count}</span>
                          </li>
                        ))}
                        {items.length > 3 && (
                          <li className="text-xs text-muted-foreground">และอีก {items.length - 3} รายการ</li>
                        )}
                      </ul>
                      <div className="flex items-center justify-between border-t border-dashed pt-3">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                          <Undo2 size={15} /> ยอดที่จะได้คืน
                        </span>
                        <span className="text-xl font-extrabold text-emerald-600">{priceFormat(order.cartTotal)}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    ระบบจะคืนเงินเข้าบัตรที่ใช้ชำระทันที ยอดจะแสดงในบัตรภายใน 5–10 วันทำการ ขึ้นอยู่กับธนาคาร
                  </p>
                </div>

                {/* ปุ่ม */}
                <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
                  <AlertDialog.Cancel
                    disabled={busy}
                    className="h-11 rounded-full px-5 text-sm font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-white disabled:opacity-50"
                  >
                    เก็บคำสั่งซื้อไว้
                  </AlertDialog.Cancel>
                  {/* ไม่ใช้ AlertDialog.Action เพราะต้องเปิดค้างไว้จนยกเลิกเสร็จ */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    disabled={busy}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-md shadow-red-600/25 transition-colors hover:bg-red-700 disabled:opacity-70"
                  >
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {busy ? "กำลังยกเลิกและคืนเงิน..." : "ยืนยันยกเลิก"}
                  </motion.button>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  );
};

export default CancelOrderDialog;
