import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { getOrders } from "../../api/user";
import useEcomStore from "../../store/ecom-store";
import { priceFormat } from "../../utils/number";
import { dateFormat } from "../../utils/dateformat";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from "../../components/OrderStatusBadge";

const History = () => {
  const token = useEcomStore((state) => state.token);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders(token)
      .then((res) => setOrders(res.data.orders || []))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">ประวัติการสั่งซื้อ</h1>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white py-16 text-center shadow-sm ring-1 ring-black/5">
          <Package size={44} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
          <Button asChild className="rounded-full">
            <Link to="/shop">เริ่มช้อปเลย</Link>
          </Button>
        </div>
      ) : (
        orders.map((order) => (
          <article
            key={order.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
              <div>
                <p className="text-xs text-muted-foreground">คำสั่งซื้อ #{order.id}</p>
                <p className="font-semibold">{dateFormat(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.orderStatus} />
            </header>

            <div className="divide-y px-5">
              {order.products?.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.product.title}</p>
                    <p className="text-muted-foreground">
                      {item.count} × {priceFormat(item.price ?? item.product.price)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">
                    {priceFormat(item.count * (item.price ?? item.product.price))}
                  </p>
                </div>
              ))}
            </div>

            <footer className="flex items-center justify-between border-t px-5 py-4">
              <span className="text-sm text-muted-foreground">รวมสุทธิ</span>
              <span className="text-lg font-extrabold text-primary">{priceFormat(order.cartTotal)}</span>
            </footer>
          </article>
        ))
      )}
    </div>
  );
};

export default History;
