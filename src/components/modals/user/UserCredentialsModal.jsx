import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import Modal from "@/components/custom/Modal";

function CopyField({ label, value }) {
   const [copied, setCopied] = useState(false);

   const copy = async () => {
      try {
         await navigator.clipboard.writeText(value ?? "");
         setCopied(true);
         setTimeout(() => setCopied(false), 1500);
      } catch {
         // Clipboard can be blocked; the value is still selectable
      }
   };

   return (
      <div className='flex flex-col gap-1.5'>
         <p className='text-xs font-semibold text-neutral-500'>{label}</p>
         <div className='flex items-center gap-2 rounded-lg border border-neutral-200 bg-white py-1.5 pr-1.5 pl-3'>
            <span className='min-w-0 flex-1 truncate text-sm font-semibold text-foreground tabular-nums select-all'>{value}</span>
            <button
               type='button'
               onClick={copy}
               aria-label={`Copy ${label.toLowerCase()}`}
               className='flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary'
            >
               {copied ? <Check className='size-3.5' aria-hidden='true' /> : <Copy className='size-3.5' aria-hidden='true' />}
               {copied ? "Copied" : "Copy"}
            </button>
         </div>
      </div>
   );
}

/** Shown when the welcome / reset email couldn't be sent, so the admin can pass the login on. */
const UserCredentialsModal = ({ isOpen, onClose, username, password }) => {
   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title='Login details'
         description="The email couldn't be sent, so pass these on to the user yourself."
         secondaryAction={null}
         contentClassName='my-0'
         primaryAction={{
            label: "Done",
            onClick: onClose,
         }}
      >
         <div className='flex flex-col gap-4'>
            <CopyField label='Username' value={username} />
            <CopyField label='Password' value={password} />

            <div className='flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-900'>
               <TriangleAlert className='mt-0.5 size-4 shrink-0 opacity-70' aria-hidden='true' />
               <p className='text-sm'>This is the only time the password is shown. Copy it before closing.</p>
            </div>
         </div>
      </Modal>
   );
};

export default UserCredentialsModal;
