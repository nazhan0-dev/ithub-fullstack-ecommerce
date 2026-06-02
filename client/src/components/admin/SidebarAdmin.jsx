import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard  , SquareKanban  , ChartBarStacked ,  PackageSearch ,  LogOut} from "lucide-react";

const SidebarAdmin = () => {
  return (
    <div
      className="bg-pink-300 w-64 text-black-100 flex 
    flex-col h-screen"
    >
      <div
        className="h-24 bg-pink-100 flex items-center
        justify-center text-2xl font-bold"
      >
        Admin Panel
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <NavLink
          to={"/admin"}
          end
          className={({ isActive }) =>
            isActive
              ? "bg-pink-400  text-white px-4 py-2 flex items-center rounded-md "
              : "text-white-300 px-4 py-2 hover:bg-pink-400 hover:text-white rounded flex items-center"
          }
        >
          <LayoutDashboard className="mr-2" />
          Dashboard
        </NavLink>

        <NavLink
          to={"manage"}
          className={({ isActive }) =>
            isActive
              ? "bg-pink-400  text-white px-4 py-2 flex items-center rounded-md "
              : "text-white-300 px-4 py-2 hover:bg-pink-400 hover:text-white rounded flex items-center"
          }
        >
          <SquareKanban className="mr-2" />
          Manage
        </NavLink>

        <NavLink
          to={"category"}
          className={({ isActive }) =>
            isActive
              ? "bg-pink-400  text-white px-4 py-2 flex items-center rounded-md "
              : "text-white-300 px-4 py-2 hover:bg-pink-400 hover:text-white rounded flex items-center"
          }
        >
          <ChartBarStacked className="mr-2" />
          Category
        </NavLink>

        <NavLink
          to={"product"}
          className={({ isActive }) =>
            isActive
              ? "bg-pink-400  text-white px-4 py-2 flex items-center rounded-md "
              : "text-white-300 px-4 py-2 hover:bg-pink-400 hover:text-white rounded flex items-center"
          }
        >
          <PackageSearch className="mr-2" />
          Product
        </NavLink>

      </nav>

      <div>
           <NavLink
          className={({ isActive }) =>
            isActive
              ? "bg-pink-400  text-white px-4 py-2 flex items-center rounded-md "
              : "text-white-300 px-4 py-2 hover:bg-pink-400 hover:text-white rounded flex items-center"
          }
        >
          <LogOut className="mr-2" />
          Logout
        </NavLink>

        </div>
    </div>
  );
};

export default SidebarAdmin;
