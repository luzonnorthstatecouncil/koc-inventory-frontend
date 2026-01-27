import IButton from "@/components/custom/Button";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { setAmountTendered } from "@/features/slice/cartSlice";
import { priceParser } from "@/helpers/parser";
import { Delete, RotateCcw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export default function ProcessPayment({ isOpen, onSubmit, onClose, total }) {
   const dispatch = useDispatch();
   const { amountTendered } = useSelector((state) => state.cart);

   const onChange = (e) => {
      dispatch(setAmountTendered(e.target.value));
   };

   const onPriceChange = (value) => {
      dispatch(setAmountTendered(Number(amountTendered) + Number(value)));
   };

   const onReset = () => {
      dispatch(setAmountTendered(0));
   };

   const onBackspace = () => {
      dispatch(setAmountTendered(String(amountTendered).slice(0, -1) || 0));
   };

   const onCancel = () => {
      onReset();
      onClose();
   };

   const onSubmitPayment = () => {
      if (amountTendered < total) {
         toast.error("Amount tendered is less than total.");
         return;
      }

      onSubmit(amountTendered);
      onClose();
   };

   return (
      <Modal
         size='sm'
         isOpen={isOpen}
         title='Process Payment'
         description='Enter payment details to process order transaction.'
         secondaryAction={null}
         contentClassName='my-0'
         className='gap-4 pb-0'
         primaryAction={null}
      >
         <Alert className='mb-3'>
            <AlertTitle>Amount to Pay</AlertTitle>
            <AlertDescription>
               <span className='font-semibold font-mono text-xl text-green-600'>{priceParser(total)}</span>
            </AlertDescription>
         </Alert>

         <IInput
            label='Amount Tendered'
            useForm={false}
            name='amount'
            className='h-12 !text-xl font-bold font-mono text-black'
            type='number'
            value={amountTendered}
            onChange={onChange}
         />

         <section className='grid grid-cols-2 gap-2 mt-3'>
            <IButton variant='outline' onClick={() => onPriceChange(5)}>
               5
            </IButton>
            <IButton variant='outline' onClick={() => onPriceChange(10)}>
               10
            </IButton>
            <IButton variant='outline' onClick={() => onPriceChange(50)}>
               50
            </IButton>
            <IButton variant='outline' onClick={() => onPriceChange(100)}>
               100
            </IButton>
            <IButton variant='outline' onClick={() => onPriceChange(500)}>
               500
            </IButton>
            <IButton variant='outline' onClick={() => onPriceChange(1000)}>
               1000
            </IButton>
            <IButton variant='outline' className='text-destructive' onClick={onReset}>
               <RotateCcw className='size-4' />
            </IButton>
            <IButton variant='outline' className='text-destructive' onClick={onBackspace}>
               <Delete className='size-5' />
            </IButton>

            <IButton type='button' variant='destructive' className='w-full mt-2' onClick={onCancel}>
               Cancel
            </IButton>

            <IButton type='button' variant='default' className='w-full mt-2' onClick={onSubmitPayment}>
               Submit
            </IButton>
         </section>
      </Modal>
   );
}
