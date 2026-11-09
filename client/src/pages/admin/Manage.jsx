import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { changeUserRole, changeUserStatus, getListAllUsers } from "../../api/admin";
import { PageHeader, Panel } from "../../components/admin/AdminUI";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const Manage = () => {
  const token = useEcomStore((state) => state.token);
  const currentUser = useEcomStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = () => {
    getListAllUsers(token)
      .then((res) => setUsers(res.data))
      .catch((err) => console.log(err));
  };

  useEffect(loadUsers, [token]);

  const handleStatus = (user) => {
    changeUserStatus(token, { id: user.id, enabled: !user.enabled })
      .then(() => {
        toast.success("อัปเดตสถานะเรียบร้อย");
        loadUsers();
      })
      .catch((err) => console.log(err));
  };

  const handleRole = (user, role) => {
    changeUserRole(token, { id: user.id, role })
      .then(() => {
        toast.success("อัปเดตสิทธิ์เรียบร้อย");
        loadUsers();
      })
      .catch((err) => console.log(err));
  };

  const q = keyword.trim().toLowerCase();
  const shown = users
    .filter((u) => !q || u.email.toLowerCase().includes(q))
    .filter((u) => roleFilter === "all" || u.role === roleFilter);

  return (
    <div>
      <PageHeader title="ผู้ใช้งาน" description={`ทั้งหมด ${users.length} บัญชี`} />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาอีเมล..."
              className="h-9 w-full rounded-full bg-muted pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-1">
            {[["all", "ทั้งหมด"], ["admin", "แอดมิน"], ["user", "ลูกค้า"]].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setRoleFilter(v)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  roleFilter === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {label} <span className="opacity-70">{v === "all" ? users.length : users.filter((u) => u.role === v).length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* มือถือ: แสดงเป็นการ์ด */}
        <ul className="divide-y md:hidden">
          {shown.map((el) => {
            const isSelf = currentUser?.id === el.id || currentUser?.email === el.email;
            return (
              <li key={el.id} className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold uppercase text-secondary-foreground">
                    {el.email[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {el.email} {isSelf && <span className="text-xs text-muted-foreground">(คุณ)</span>}
                    </p>
                    <span className={cn("text-xs font-semibold", el.enabled ? "text-emerald-600" : "text-zinc-500")}>
                      {el.enabled ? "ใช้งาน" : "ระงับ"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={el.role}
                    disabled={isSelf}
                    onChange={(e) => handleRole(el, e.target.value)}
                    aria-label="สิทธิ์"
                    className="flex-1 rounded-lg border bg-white px-2 py-1.5 text-sm disabled:opacity-50"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    onClick={() => handleStatus(el)}
                    disabled={isSelf}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-40",
                      el.enabled ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {el.enabled ? "ระงับบัญชี" : "เปิดใช้งาน"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">อีเมล</th>
                <th className="px-4 py-3 font-semibold">สิทธิ์</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shown.map((el, index) => {
                const isSelf = currentUser?.id === el.id || currentUser?.email === el.email;
                return (
                  <tr key={el.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold uppercase text-secondary-foreground">
                          {el.email[0]}
                        </span>
                        <span className="font-medium">{el.email}</span>
                        {isSelf && <span className="text-xs text-muted-foreground">(คุณ)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={el.role}
                        disabled={isSelf}
                        onChange={(e) => handleRole(el, e.target.value)}
                        className="rounded-lg border bg-white px-2 py-1 text-sm disabled:opacity-50"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          el.enabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600",
                        )}
                      >
                        {el.enabled ? "ใช้งาน" : "ระงับ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleStatus(el)}
                        disabled={isSelf}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-40",
                          el.enabled
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                        )}
                      >
                        {el.enabled ? "ระงับบัญชี" : "เปิดใช้งาน"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">ไม่พบผู้ใช้งาน</p>
        )}
      </Panel>
    </div>
  );
};

export default Manage;
