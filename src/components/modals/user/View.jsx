import Modal from "@/components/custom/Modal";
import { dateParser } from "@/helpers/parser";
import { CalendarDays, Mail, ShieldCheck, User2 } from "lucide-react";
import { useSelector } from "react-redux";

const ROLE_STYLES = {
   admin: "bg-primary/10 text-primary",
   cashier: "bg-violet-50 text-violet-700",
   staff: "bg-blue-50 text-blue-700",
};

function avatarColor(name = "") {
   const palette = [
      "bg-rose-100 text-rose-700",
      "bg-orange-100 text-orange-700",
      "bg-amber-100 text-amber-700",
      "bg-emerald-100 text-emerald-700",
      "bg-cyan-100 text-cyan-700",
      "bg-blue-100 text-blue-700",
      "bg-violet-100 text-violet-700",
      "bg-pink-100 text-pink-700",
   ];
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return palette[Math.abs(hash) % palette.length];
}

export default function ViewUser({ isOpen, onClose }) {
   const { selectedUser } = useSelector((state) => state.user);

   const name = selectedUser?.full_name ?? "";
   const initials = `${name.charAt(0)}${name.split(" ")[1]?.charAt(0) ?? ""}`.toUpperCase();
   const isActive = selectedUser?.status === "active";
   const roleStyle = ROLE_STYLES[selectedUser?.role?.toLowerCase()] ?? "bg-gray-100 text-gray-600";

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         isLoading={!selectedUser}
         title='User Details'
         secondaryAction={null}
         primaryAction={{ label: "Close", onConfirm: onClose }}
      >
         {/* Avatar + name hero */}
         <div className='flex flex-col items-center gap-3 py-4 border-b border-gray-100 mb-4'>
            <div className={`size-16 rounded-full flex items-center justify-center text-xl font-bold ${avatarColor(name)}`}>
               {initials}
            </div>
            <div className='text-center'>
               <p className='font-bold text-lg text-foreground leading-tight'>{name}</p>
               <div className='flex items-center justify-center gap-2 mt-1.5'>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleStyle}`}>
                     {selectedUser?.role}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                     <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                     {isActive ? "Active" : "Inactive"}
                  </span>
               </div>
            </div>
         </div>

         {/* Detail rows */}
         <div className='space-y-2'>
            {[
               { icon: Mail, label: "Email", value: selectedUser?.email },
               { icon: User2, label: "Username", value: selectedUser?.username },
               { icon: ShieldCheck, label: "Role", value: selectedUser?.role, capitalize: true },
               { icon: CalendarDays, label: "Date Added", value: dateParser(selectedUser?.created_at) },
            ].map(({ icon: Icon, label, value, capitalize }) => (
               <div key={label} className='flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5'>
                  <div className='flex-shrink-0 size-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center'>
                     <Icon className='size-3.5 text-muted-foreground' />
                  </div>
                  <div className='min-w-0'>
                     <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>{label}</p>
                     <p className={`text-sm font-medium text-foreground truncate ${capitalize ? "capitalize" : ""}`}>{value ?? "—"}</p>
                  </div>
               </div>
            ))}
         </div>
      </Modal>
   );
}
