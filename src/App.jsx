import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/custom/ProtectedRoute";
import LoadingState from "./components/custom/LoadingState";

import {
   ACCOUNT,
   AUDIT_LOGS,
   INVENTORY_ITEMS,
   INVENTORY_STOCKS,
   INVENTORY_SUPPLIERS,
   KITS,
   LOGIN,
   ORDERS,
   POINT_OF_SALE,
   REPORTS,
   SETTINGS,
   STOCK_APPROVALS,
   STOCK_MOVEMENTS,
   USER_MANAGEMENT,
} from "./constants/routes";

// Each page is its own chunk, downloaded the first time it is visited. Heavy libraries
// (charts, spreadsheet/PDF export) then load only on the pages that use them.
const Login = lazy(() => import("./pages/Login"));
const POS = lazy(() => import("./pages/POS"));
const Orders = lazy(() => import("./pages/Orders"));
const InventoryItems = lazy(() => import("./pages/InventoryItems"));
const InventoryStocks = lazy(() => import("./pages/InventoryStocks"));
const StockApprovals = lazy(() => import("./pages/StockApprovals"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Kits = lazy(() => import("./pages/Kits"));
const StockMovements = lazy(() => import("./pages/StockMovements"));
const UserManagement = lazy(() => import("./pages/User"));
const Reports = lazy(() => import("./pages/Reports"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const Account = lazy(() => import("./pages/Account"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));

const protectedRoutes = [
   { path: POINT_OF_SALE.path, Page: POS },
   { path: ORDERS.path, Page: Orders },
   { path: INVENTORY_ITEMS.path, Page: InventoryItems },
   { path: INVENTORY_STOCKS.path, Page: InventoryStocks },
   { path: STOCK_APPROVALS.path, Page: StockApprovals },
   { path: INVENTORY_SUPPLIERS.path, Page: Suppliers },
   { path: KITS.path, Page: Kits },
   { path: STOCK_MOVEMENTS.path, Page: StockMovements },
   { path: USER_MANAGEMENT.path, Page: UserManagement },
   { path: REPORTS.path, Page: Reports },
   { path: AUDIT_LOGS.path, Page: AuditLogs },
   { path: SETTINGS.path, Page: Settings },
   { path: ACCOUNT.path, Page: Account },
];

export default function App() {
   return (
      <Suspense
         fallback={
            <div className='flex items-center justify-center h-screen w-full'>
               <LoadingState />
            </div>
         }
      >
         <Routes>
            {/* public routes */}
            <Route path={LOGIN.path} element={<Login />} />
            <Route path='/invoice' element={<InvoicePage />} />

            {/* unknown paths go to Sales (ProtectedRoute sends signed-out users to Login) */}
            <Route path='*' element={<Navigate to={POINT_OF_SALE.path} />} />

            {/* protected routes */}
            {protectedRoutes.map(({ path, Page }) => (
               <Route key={path} path={path} element={<ProtectedRoute element={<Page />} />} />
            ))}
         </Routes>
      </Suspense>
   );
}
