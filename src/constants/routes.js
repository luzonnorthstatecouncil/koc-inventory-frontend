import {
   BookAlert,
   Calendar,
   ChartLine,
   ComputerIcon,
   Folder,
   Inbox,
   Package2,
   ReceiptText,
   SettingsIcon,
   User2,
   UserRoundCog,
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
   icon: ComputerIcon,
};

export const ORDERS = {
   path: "/transactions",
   title: "Transaction History",
   roles: ["admin", "user", "supervisor"],
   icon: ReceiptText,
};

export const INVENTORY_ITEMS = {
   path: "/inventory/items",
   title: "Items",
   roles: ["admin", "user", "supervisor"],
   icon: Package2,
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
   icon: UserRoundCog,
};

export const STOCK_APPROVALS = {
   path: "/inventory/approvals",
   title: "Approvals",
   roles: ["admin"],
   icon: BookAlert,
};

export const INVENTORY = {
   title: "Inventory Management",
   roles: ["admin", "user", "supervisor"],
   children: [INVENTORY_ITEMS, INVENTORY_STOCKS, INVENTORY_SUPPLIERS, STOCK_APPROVALS],
   icon: Folder,
};

export const USER_MANAGEMENT = {
   path: "/user-management",
   title: "User Management",
   roles: ["admin"],
   icon: User2,
};

export const AUDIT_LOGS = {
   path: "/audit-logs",
   title: "Audit Logs",
   roles: ["admin"],
   icon: Calendar,
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
