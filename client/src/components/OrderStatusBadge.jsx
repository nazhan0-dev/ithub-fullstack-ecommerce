import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "../utils/orderStatus";

const styles = {
  "Not Process": "bg-zinc-100 text-zinc-700",
  Processing: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

const OrderStatusBadge = ({ status, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
      styles[status] || styles["Not Process"],
      className,
    )}
  >
    <span className="size-1.5 rounded-full bg-current" />
    {STATUS_LABELS[status] || status}
  </span>
);

export default OrderStatusBadge;
