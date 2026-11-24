import Modal from "@/components/custom/Modal";
import { ROLE_OPTIONS } from "@/constants/options.js";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";

const roleLabel = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? "—";

function Fact({ label, children }) {
   return (
      <div className='flex items-baseline justify-between gap-4'>
         <dt className='text-sm text-neutral-600'>{label}</dt>
         <dd className='truncate text-sm font-medium text-foreground tabular-nums'>{children}</dd>
      </div>
   );
}

export default function ViewUser({ isOpen, onClose }) {
   const { selectedUser } = useSelector((state) => state.user);
   const isActive = selectedUser?.status === "active";

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         isLoading={!selectedUser}
         title='User'
         secondaryAction={null}
         primaryAction={{ label: "Close", onConfirm: onClose }}
      >
         <div className='flex flex-col gap-5'>
            <section className='flex flex-col gap-1'>
               <p className={cn("inline-flex items-center gap-2 text-sm font-medium", isActive ? "text-neutral-700" : "text-neutral-500")}>
                  <span className={cn("size-2 rounded-full", isActive ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
                  {isActive ? "Active" : "Inactive"}
               </p>
               <p className='text-2xl font-bold tracking-tight text-foreground'>{selectedUser?.full_name ?? "—"}</p>
               <p className='text-sm text-neutral-500'>{roleLabel(selectedUser?.role)}</p>
            </section>

            <section className='flex flex-col gap-2 rounded-xl bg-neutral-50 px-4 py-3'>
               <h3 className='text-xs font-semibold text-neutral-500'>Account</h3>
               <dl className='flex flex-col gap-1.5'>
                  <Fact label='Username'>{selectedUser?.username ?? "—"}</Fact>
                  <Fact label='Email'>{selectedUser?.email ?? "—"}</Fact>
                  <Fact label='Role'>{roleLabel(selectedUser?.role)}</Fact>
                  {selectedUser?.created_at && (
                     <Fact label='Added'>
                        {dateParser(selectedUser.created_at, "PP")} · {dateParser(selectedUser.created_at, "p")}
                     </Fact>
                  )}
               </dl>
            </section>
         </div>
      </Modal>
   );
}
