import { cn } from "@/lib/utils";

// ชิ้นส่วน UI ที่ใช้ร่วมกันในหน้า admin
export const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

export const Panel = ({ className, children }) => (
  <div className={cn("rounded-2xl bg-white shadow-sm ring-1 ring-black/5", className)}>{children}</div>
);

export const FieldLabel = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
    {children}
  </label>
);

export const inputClass =
  "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none ring-primary/30 transition focus:border-primary focus:ring-2";
