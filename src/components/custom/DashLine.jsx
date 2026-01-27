import { cn } from "@/lib/utils";

export default function DashLine({ className }) {
   return <div className={cn("flex-grow border-t border-dashed border-black mx-1", className)} aria-hidden='true' />;
}
