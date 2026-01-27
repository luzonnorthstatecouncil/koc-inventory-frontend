import { ALPHABETS_ONLY, ALPHANUMERIC_ONLY, NUMERIC_ONLY } from "./regex";

export const ROLE_OPTIONS = [
   { value: "admin", label: "State Officer" },
   { value: "supervisor", label: "Supervisor" },
   { value: "user", label: "Staff" },
];

export const UNIT_OPTIONS = [
   { value: "pcs", label: "Piece" },
   { value: "set", label: "Set" },
   { value: "box", label: "Box" },
   { value: "carton", label: "Carton" },
   { value: "pack", label: "Pack" },
   { value: "pair", label: "Pair" },
   { value: "roll", label: "Roll" },
   { value: "sheet", label: "Sheet" },
   { value: "meter", label: "Meter" },
   { value: "cm", label: "Centimeter" },
   { value: "kg", label: "Kilogram" },
   { value: "g", label: "Gram" },
   { value: "l", label: "Liter" },
   { value: "ml", label: "Milliliter" },
   { value: "bottle", label: "Bottle" },
   { value: "tube", label: "Tube" },
   { value: "pouch", label: "Pouch" },
   { value: "unit", label: "Unit" },
];

export const SPECIFICATION_NAME_OPTIONS = [
   { value: "color", label: "Color", regex: ALPHABETS_ONLY },
   { value: "size", label: "Size", regex: ALPHABETS_ONLY },
   { value: "weight", label: "Weight", regex: NUMERIC_ONLY },
   { value: "material", label: "Material", regex: ALPHABETS_ONLY },
   { value: "dimensions", label: "Dimensions", regex: ALPHANUMERIC_ONLY },
   { value: "capacity", label: "Capacity", regex: NUMERIC_ONLY },
   { value: "voltage", label: "Voltage", regex: NUMERIC_ONLY },
   { value: "wattage", label: "Wattage", regex: NUMERIC_ONLY },
];

export const REMOVE_STOCK_REMARKS_OPTIONS = [
   { value: "Expired Stocks", label: "Expired Stocks" },
   { value: "Damaged or Defective Stocks", label: "Damaged or Defective Stocks" },
   { value: "Lost or Missing Stocks", label: "Lost or Missing Stocks" },
   { value: "Excess or Overstocked Items", label: "Excess or Overstocked Items" },
];

export const ADJUSTMENT_STOCK_REMARKS_OPTIONS = [
   { value: "Inventory Count Correction", label: "Inventory Count Correction" },
   { value: "Wrong Quantity Received", label: "Wrong Quantity Recorded" },
   { value: "Return to Stock", label: "Internal Return to Stock" },
];

export const REFUND_REASONS_OPTIONS = [
   { value: "Product Defect", label: "Product Defect" },
   { value: "Wrong Item Sent", label: "Wrong Item Sent" },
   { value: "Customer Changed Mind", label: "Customer Changed Mind" },
   { value: "Late Delivery", label: "Late Delivery" },
   { value: "Other", label: "Other" },
];

export const REPORTS_DATE_RANGE_OPTIONS = [
   { value: "7", label: "Last 7 Days" },
   { value: "30", label: "Last 30 Days" },
   { value: "90", label: "Last 90 Days" },
   { value: "365", label: "Last 365 Days" },
];

export const STOCK_ADJUSTMENT_TYPES = [
   { value: "add", label: "Add Stock" },
   { value: "remove", label: "Remove Stock" },
];

export const STOCK_REQUEST_STATUS = [
   { value: "pending", label: "Pending" },
   { value: "approved", label: "Approved" },
   { value: "rejected", label: "Rejected" },
];
