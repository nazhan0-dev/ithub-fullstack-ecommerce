import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipboardList, Search } from "lucide-react";
import { changeOrderStatus, getOrdersAdmin } from "../../api/admin";
import { priceFormat } from "../../utils/number";
import { dateFormat } from "../../utils/dateformat";
import { PageHeader, Panel } from "../../components/admin/AdminUI";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { ORDER_STATUSES, STATUS_LABELS, orderCode, parseOrderCode } from "../../utils/orderStatus";
import { cn } from "@/lib/utils";

const StatusSelect = ({ value, onChange, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label="เปลี่ยนสถานะ"
    className={cn(
      "rounded-lg border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
      className,
    )}
  >
    {ORDER_STATUSES.map((s) => (
      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
    ))}
  </select>
);

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "all";

  const loadOrders = () => {
    getOrdersAdmin()
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrders, []);

  const handleChangeStatus = (orderId, next) => {
    changeOrderStatus(orderId, next)
      .then(() => {
        toast.success(`เปลี่ยนสถานะ #${orderCode(orderId)} เป็น "${STATUS_LABELS[next]}"`);
        loadOrders();
      })
      .catch((err) => {
        console.log(err);
        toast.error("เปลี่ยนสถานะไม่สำเร็จ");
      });
  };

  const setStatus = (s) => setParams(s === "all" ? {} : { status: s }, { replace: true });

  const count = (s) => (s === "all" ? orders.length : orders.filter((o) => o.orderStatus === s).length);
  const q = keyword.trim().toLowerCase().replace(/^#/, "");
  const qId = parseOrderCode(keyword); // ค้นด้วย ORD-00020 / #20 / 20 ได้
  const filtered = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((o) => status === "all" || o.orderStatus === status)
    .filter((o) => !q || o.id === qId || o.orderedBy?.email?.toLowerCase().includes(q));

  const tabs = ["all", ...ORDER_STATUSES];

  return (
    <div>
      <PageHeader title="คำสั่งซื้อ" description="จัดการและติดตามสถานะคำสั่งซื้อทั้งหมด" />

      <Panel className="overflow-hidden">
        {/* แถบสถานะ + ค้นหา */}
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {tabs.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs font-semibold",
                    status === s ? "bg-white/25" : "bg-muted text-foreground",
                  )}
                >
                  {count(s)}
                </span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาอีเมล หรือเลขคำสั่งซื้อ (ORD-00020)"
              className="h-9 w-full rounded-full bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* มือถือ: การ์ด */}
        <ul className="divide-y md:hidden">
          {filtered.map((item) => (
            <li key={item.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.orderedBy?.email}</p>
                  <p className="text-xs text-muted-foreground">#{orderCode(item.id)} · {dateFormat(item.createdAt)}</p>
                </div>
                <OrderStatusBadge status={item.orderStatus} />
              </div>
              <ul className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
                {item.products?.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="truncate">{p.product.title}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {p.count} × {priceFormat(p.price ?? p.product.price)}
                    </span>
                  </li>
                ))}
              </ul>
              {item.orderedBy?.address && (
                <p className="text-xs text-muted-foreground">ที่อยู่: {item.orderedBy.address}</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">{priceFormat(item.cartTotal)}</span>
                <StatusSelect value={item.orderStatus} onChange={(v) => handleChangeStatus(item.id, v)} />
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop: ตาราง */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">คำสั่งซื้อ</th>
                <th className="px-4 py-3 font-semibold">ลูกค้า</th>
                <th className="px-4 py-3 font-semibold">สินค้า</th>
                <th className="px-4 py-3 text-right font-semibold">ยอดรวม</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y align-top">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold">#{orderCode(item.id)}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">{dateFormat(item.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.orderedBy?.email}</p>
                    {item.orderedBy?.address && (
                      <p className="mt-0.5 max-w-[220px] text-xs text-muted-foreground">{item.orderedBy.address}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {item.products?.map((p) => (
                        <li key={p.id} className="flex justify-between gap-4">
                          <span className="max-w-[200px] truncate">{p.product.title}</span>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {p.count} × {priceFormat(p.price ?? p.product.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    {priceFormat(item.cartTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-2">
                      <OrderStatusBadge status={item.orderStatus} />
                      <StatusSelect
                        value={item.orderStatus}
                        onChange={(v) => handleChangeStatus(item.id, v)}
                        className="py-1 text-xs"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <ClipboardList size={36} strokeWidth={1.5} />
            <p className="text-sm">{orders.length === 0 ? "ยังไม่มีคำสั่งซื้อ" : "ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง"}</p>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default ManageOrders;
