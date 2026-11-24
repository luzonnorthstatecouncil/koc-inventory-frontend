import {
   Activity,
   ChartLine,
   ClipboardCheck,
   Folder,
   History,
   Layers,
   Monitor,
   Package,
   ReceiptText,
   SettingsIcon,
   Truck,
   User2,
   Users,
   Warehouse,
} from "lucide-react";

export const LOGIN = {
   path: "/login",
   title: "Login",
};

export const HOME = {
   path: "/",
   title: "Home",
};

export const POINT_OF_SALE = {
   path: "/sales",
   title: "Sales",
   roles: ["admin", "user", "supervisor"],
   icon: Monitor,
};

export const ORDERS = {
   path: "/transactions",
   title: "Transaction History",
   navTitle: "Transactions",
   roles: ["admin", "user", "supervisor"],
   icon: ReceiptText,
};

export const INVENTORY_ITEMS = {
   path: "/inventory/items",
   title: "Items",
   roles: ["admin", "user", "supervisor"],
   icon: Package,
};

export const INVENTORY_STOCKS = {
   path: "/inventory/stocks",
   title: "Stocks",
   roles: ["admin", "user", "supervisor"],
   icon: Warehouse,
};

export const INVENTORY_SUPPLIERS = {
   path: "/inventory/suppliers",
   title: "Suppliers",
   roles: ["admin", "supervisor"],
   icon: Truck,
};

export const STOCK_APPROVALS = {
   path: "/inventory/approvals",
   title: "Approvals",
   roles: ["admin"],
   icon: ClipboardCheck,
};

export const KITS = {
   path: "/inventory/kits",
   title: "Kits",
   roles: ["admin", "user", "supervisor"],
   icon: Layers,
};

export const STOCK_MOVEMENTS = {
   path: "/inventory/movements",
   title: "Movements",
   roles: ["admin", "user", "supervisor"],
   icon: Activity,
};

export const INVENTORY = {
   title: "Inventory Management",
   roles: ["admin", "user", "supervisor"],
   children: [
      INVENTORY_ITEMS,
      KITS,
      INVENTORY_STOCKS,
      STOCK_MOVEMENTS,
      INVENTORY_SUPPLIERS,
      STOCK_APPROVALS,
   ],
   icon: Folder,
};

export const USER_MANAGEMENT = {
   path: "/user-management",
   title: "User Management",
   navTitle: "Users",
   roles: ["admin"],
   icon: Users,
};

export const AUDIT_LOGS = {
   path: "/audit-logs",
   title: "Audit Logs",
   navTitle: "Audit log",
   roles: ["admin"],
   icon: History,
};

export const SETTINGS = {
   path: "/settings",
   title: "Settings",
   roles: ["admin"],
   icon: SettingsIcon,
   disabled: true,
};

export const REPORTS = {
   path: "/reports",
   title: "Reports",
   roles: ["admin", "supervisor"],
   icon: ChartLine,
   // disabled: true,
};

export const ACCOUNT = {
   path: "/account",
   title: "Account",
   icon: User2,
};

export const CORE_MODULES = {
   title: "Core Modules",
   modules: [POINT_OF_SALE, ORDERS, INVENTORY, USER_MANAGEMENT],
};

export const MORE_MODULES = {
   title: "More",
   modules: [REPORTS, AUDIT_LOGS],
};

export const MODULES = [CORE_MODULES, MORE_MODULES];

// Sidebar groups. Visibility still comes from each route's `roles`.
export const NAV_GROUPS = [
   { title: "Sell", items: [POINT_OF_SALE, ORDERS] },
   {
      title: "Inventory",
      items: [INVENTORY_ITEMS, KITS, INVENTORY_STOCKS, STOCK_MOVEMENTS, INVENTORY_SUPPLIERS, STOCK_APPROVALS],
   },
   { title: "Admin", items: [USER_MANAGEMENT, REPORTS, AUDIT_LOGS] },
];
