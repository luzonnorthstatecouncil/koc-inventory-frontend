import { Banknote, CreditCard, ScanQrCode } from "lucide-react";

export const PAYMENT_METHOD_OPTIONS = [
   { value: "cash", label: "Cash", icon: Banknote, disabled: false },
   { value: "card", label: "Card", icon: CreditCard, disabled: true },
   { value: "scan", label: "Scan", icon: ScanQrCode, disabled: true },
];
