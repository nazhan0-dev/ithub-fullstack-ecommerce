import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { ClipboardList, Package, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { getListAllUsers, getOrdersAdmin } from "../../api/admin";
import { listProduct } from "../../api/product";
import { numberFormat, priceFormat } from "../../utils/number";
import { dateFormat } from "../../utils/dateformat";
import { PageHeader, Panel } from "../../components/admin/AdminUI";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import { RevenueChart, StatusBreakdown, TopProducts } from "../../components/admin/DashboardCharts";
import { needsRestock, stockThreshold } from "../../utils/product";
import { orderCode } from "../../utils/orderStatus";
import { cn } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7 วัน" },
  { days: 30, label: "30 วัน" },
  { days: 90, label: "90 วัน" },
  { days: 365, label: "12 เดือน" },
];
const rangeLabel = (d) => RANGES.find((r) => r.days === d)?.label || `${d} วัน`;

const sumRevenue = (orders) =>
  orders.filter((o) => o.orderStatus !== "Cancelled").reduce((s, o) => s + o.cartTotal, 0);

const StatCard = ({ label, value, icon: Icon, trend, hint }) => (
  <Panel className="p-5">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-extrabold tracking-tight">{value}</p>
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon size={20} />
      </span>
    </div>
    {(trend !== undefined || hint) && (
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        {trend !== undefined && trend !== null && (
          <span className={cn("flex items-center gap-0.5 font-semibold", trend >= 0 ? "text-emerald-600" : "text-red-600")}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
        {hint}
      </p>
    )}
  </Panel>
);

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    Promise.allSettled([
      getOrdersAdmin().then((res) => setOrders(res.data || [])),
      getListAllUsers().then((res) => setUsers(res.data || [])),
      listProduct(1000).then((res) => setProducts(res.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  // เทียบช่วงเวลาปัจจุบันกับช่วงก่อนหน้าที่ยาวเท่ากัน
  const now = moment();
  const inRange = (o, from, to) => moment(o.createdAt).isBetween(from, to, undefined, "[)");
  const curFrom = now.clone().startOf("day").subtract(days - 1, "days");
  const prevFrom = curFrom.clone().subtract(days, "days");
  const curOrders = orders.filter((o) => inRange(o, curFrom, now));
  const prevOrders = orders.filter((o) => inRange(o, prevFrom, curFrom));
  const curRevenue = sumRevenue(curOrders);
  const prevRevenue = sumRevenue(prevOrders);
  const pctChange = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

  const lowStock = products.filter(needsRestock).sort((a, b) => a.quantity - b.quantity);
  const pending = orders.filter((o) => o.orderStatus === "Not Process").length;
  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="แดชบอร์ด" description="ภาพรวมของร้านค้า" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white" />)}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมของร้านค้า"
        action={
          <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  days === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`ยอดขาย ${rangeLabel(days)}`} value={priceFormat(curRevenue)} icon={Wallet}
          trend={pctChange(curRevenue, prevRevenue)} hint={`เทียบ ${rangeLabel(days)}ก่อนหน้า`} />
        <StatCard label={`คำสั่งซื้อ ${rangeLabel(days)}`} value={numberFormat(curOrders.length)} icon={ClipboardList}
          trend={pctChange(curOrders.length, prevOrders.length)} hint={`รอดำเนินการ ${pending} รายการ`} />
        <StatCard label="สินค้าทั้งหมด" value={numberFormat(products.length)} icon={Package}
          hint={lowStock.length > 0 ? `ใกล้หมด ${lowStock.length} รายการ` : "สต็อกเพียงพอ"} />
        <StatCard label="ผู้ใช้งาน" value={numberFormat(users.length)} icon={Users}
          hint={`ยอดขายรวมทั้งหมด ${priceFormat(sumRevenue(orders))}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel className="p-5">
          <div className="mb-4">
            <h2 className="font-bold">{days > 90 ? "ยอดขายรายเดือน" : "ยอดขายรายวัน"}</h2>
            <p className="text-xs text-muted-foreground">ไม่รวมคำสั่งซื้อที่ยกเลิก · ชี้ที่แท่งเพื่อดูรายละเอียด</p>
          </div>
          <RevenueChart orders={orders} days={days} onShowLonger={days < 365 ? () => setDays(365) : undefined} />
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-4 font-bold">สถานะคำสั่งซื้อ</h2>
          <StatusBreakdown orders={orders} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel className="overflow-hidden xl:col-span-1">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold">สินค้าขายดี</h2>
          </div>
          <div className="p-5">
            <TopProducts products={products} />
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-bold">คำสั่งซื้อล่าสุด</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">ดูทั้งหมด</Link>
          </div>
          <ul className="divide-y">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.orderedBy?.email}</p>
                  <p className="text-xs text-muted-foreground">#{orderCode(o.id)} · {dateFormat(o.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold">{priceFormat(o.cartTotal)}</span>
                  <OrderStatusBadge status={o.orderStatus} />
                </div>
              </li>
            ))}
          </ul>
          {recent.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>}
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold">สินค้าใกล้หมด</h2>
            <p className="text-xs text-muted-foreground">คงเหลือถึงเกณฑ์ที่ตั้งไว้ของแต่ละสินค้า</p>
          </div>
          <ul className="divide-y">
            {lowStock.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <Link to={`/admin/product/${p.id}`} className="truncate hover:text-primary">{p.title}</Link>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                  p.quantity <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                  {p.quantity <= 0 ? "หมด" : `เหลือ ${p.quantity} / ${stockThreshold(p)}`}
                </span>
              </li>
            ))}
          </ul>
          {lowStock.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">สต็อกเพียงพอทุกรายการ</p>}
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;
