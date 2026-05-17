import { Routes, Route, Navigate } from "react-router-dom";
import getToken from "./helpers/getToken";
import ProtectedRoute from "./components/custom/ProtectedRoute";

import Login from "./pages/Login";
import POS from "./pages/POS";
import InventoryItems from "./pages/InventoryItems";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/User";
import Reports from "./pages/Reports";
import InvoicePage from "./pages/InvoicePage";
import Kits from "./pages/Kits";

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
import InventoryStocks from "./pages/InventoryStocks";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import Suppliers from "./pages/Suppliers";
import StockApprovals from "./pages/StockApprovals";
import StockMovements from "./pages/StockMovements";

export default function App() {
   const token = getToken();

   // redirect to login if no token
   if (!token) {
      <Navigate to={LOGIN.path} replace />;
   }

   // protected route list for easier maintenance
   const protectedRoutes = [
      { path: POINT_OF_SALE.path, element: <POS /> },
      { path: ORDERS.path, element: <Orders /> },
      { path: INVENTORY_ITEMS.path, element: <InventoryItems /> },
      { path: INVENTORY_STOCKS.path, element: <InventoryStocks /> },
      { path: STOCK_APPROVALS.path, element: <StockApprovals /> },
      { path: INVENTORY_SUPPLIERS.path, element: <Suppliers /> },
      { path: KITS.path, element: <Kits /> },
      { path: STOCK_MOVEMENTS.path, element: <StockMovements /> },
      { path: USER_MANAGEMENT.path, element: <UserManagement /> },
      { path: REPORTS.path, element: <Reports /> },
      { path: AUDIT_LOGS.path, element: <AuditLogs /> },
      { path: SETTINGS.path, element: <Settings /> },
      { path: ACCOUNT.path, element: <Account /> },
   ];

   return (
      <Routes>
         {/* public route */}
         <Route path={LOGIN.path} element={<Login />} />
         <Route path='/invoice' element={<InvoicePage />} />

         {/* redirect base paths */}
         {/* <Route path={HOME.path} element={<Navigate to={POINT_OF_SALE.path} />} /> */}
         <Route path='*' element={<Navigate to={POINT_OF_SALE.path} />} />

         {/* protected routes */}
         {protectedRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={<ProtectedRoute element={element} />} />
         ))}
      </Routes>
   );
}
