import { useState } from "react";
import IButton from "@/components/custom/Button";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import IAlert from "@/components/custom/Alert";
import { useDispatch, useSelector } from "react-redux";
import { setInvoiceNumber } from "@/features/slice/cartSlice";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export default function InvoiceNumber({ isOpen, onSubmit, onClose }) {
   const dispatch = useDispatch();
   const { invoiceNumber } = useSelector((state) => state.cart);

   const onChange = (e) => {
      dispatch(setInvoiceNumber(e.target.value));
   };

   const onCancel = () => {
      dispatch(setInvoiceNumber(""));
      onClose();
   };

   const onSubmitInvoiceNumber = () => {
      const trimmedInvoiceNumber = invoiceNumber.trim();

      if (!trimmedInvoiceNumber) {
         toast.error("Please enter an invoice number.");
         return;
      }

      onSubmit(trimmedInvoiceNumber);
   };

   return (
      <Modal
         size='sm'
         isOpen={isOpen}
         title='Enter Invoice Number'
         description='Please enter the invoice number before proceeding to payment.'
         secondaryAction={null}
         contentClassName='my-0'
         className='gap-4 pb-0'
         primaryAction={null}
      >
         <IAlert
            variant='default'
            title='Invoice Number Required'
            description='This will be used to identify and track the transaction.'
            wrapperClassName='mb-4'
         />

         <IInput
            label='Invoice Number'
            useForm={false}
            name='invoice_number'
            className='h-12 !text-lg font-semibold uppercase'
            placeholder='e.g., INV-2026-001'
            value={invoiceNumber}
            onChange={onChange}
            autoFocus
         />

         <section className='grid grid-cols-2 gap-2 mt-3'>
            <IButton type='button' variant='destructive' className='w-full' onClick={onCancel}>
               Cancel
            </IButton>

            <IButton type='button' variant='default' className='w-full' onClick={onSubmitInvoiceNumber}>
               Continue to Payment
            </IButton>
         </section>
      </Modal>
   );
}
