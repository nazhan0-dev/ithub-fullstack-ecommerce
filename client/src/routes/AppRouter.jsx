import { lazy, Suspense } from "react";
import { createBrowserRouter, Link, Navigate, RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Home from "../pages/Home";
import Shop from "../pages/Shop";
import About from "../pages/About";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Layout from "../layouts/Layout";
import AuthLayout from "../layouts/AuthLayout";
import LayoutUser from "../layouts/LayoutUser";
import ProtectRoute from "./ProtectRoute";

// หน้าที่ใช้ไลบรารีใหญ่ (admin, ชำระเงิน/Stripe) โหลดแยกเมื่อเข้าใช้จริง
const LayoutAdmin = lazy(() => import("../layouts/LayoutAdmin"));
const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const Category = lazy(() => import("../pages/admin/Category"));
const Product = lazy(() => import("../pages/admin/Product"));
const EditProduct = lazy(() => import("../pages/admin/EditProduct"));
const Manage = lazy(() => import("../pages/admin/Manage"));
const ManageOrders = lazy(() => import("../pages/admin/ManageOrders"));
const History = lazy(() => import("../pages/user/History"));
const Payment = lazy(() => import("../pages/user/Payment"));

const lazyPage = (element) => (
  <Suspense
    fallback={
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    }
  >
    {element}
  </Suspense>
);

const NotFound = () => (
  <div className="flex flex-col items-center gap-3 py-24 text-center">
    <p className="text-6xl font-black text-primary">404</p>
    <p className="text-muted-foreground">ไม่พบหน้าที่คุณต้องการ</p>
    <Link to="/" className="font-semibold text-primary hover:underline">
      กลับหน้าแรก
    </Link>
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "about", element: <About /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      {
        // Login / Register ใช้กรอบเดียวกัน -> สลับหน้าแล้วมีแอนิเมชัน
        element: <AuthLayout />,
        children: [
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/admin",
    element: <ProtectRoute role="admin" element={lazyPage(<LayoutAdmin />)} />,
    children: [
      { index: true, element: lazyPage(<Dashboard />) },
      { path: "category", element: lazyPage(<Category />) },
      { path: "product", element: lazyPage(<Product />) },
      { path: "product/:id", element: lazyPage(<EditProduct />) },
      { path: "manage", element: lazyPage(<Manage />) },
      { path: "orders", element: lazyPage(<ManageOrders />) },
    ],
  },
  {
    path: "/user",
    element: <ProtectRoute role="user" element={<LayoutUser />} />,
    children: [
      { index: true, element: <Navigate to="history" replace /> },
      { path: "payment", element: lazyPage(<Payment />) },
      { path: "history", element: lazyPage(<History />) },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
