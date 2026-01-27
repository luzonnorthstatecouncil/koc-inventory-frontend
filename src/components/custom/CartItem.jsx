import { SquareMinus, SquarePlus, Trash2Icon, X } from "lucide-react";
import Title from "./Title";
import Paragraph from "./Paragraph";
import { useDispatch } from "react-redux";
import { removeFromCart, updateCart } from "@/features/slice/cartSlice";

export default function CartItem({ item }) {
   const dispatch = useDispatch();

   const handleQuantity = (isRemove) => {
      if (isRemove && item.quantity === 1) {
         dispatch(removeFromCart(item.id));
         return;
      }

      dispatch(
         updateCart({
            id: item.id,
            data: {
               ...item,
               quantity: isRemove ? item.quantity - 1 : item.quantity + 1,
            },
         }),
      );
   };

   const handleRemove = () => dispatch(removeFromCart(item.id));

   return (
      <div className='relative flex items-center justify-between select-none w-full group rounded p-2 sm:p-3 bg-white border border-outline overflow-hidden border-l-2 sm:border-l-3 border-l-emphasis'>
         <div className='flex flex-col w-1/2'>
            <Title size='xs' className='sm:text-sm text-black select-none leading-4 sm:leading-5 font-bold'>
               {item.name}
            </Title>
            <Title size='xs' className='sm:text-sm font-normal text-black mt-0.5 sm:mt-1 select-none'>
               x{item.quantity}
            </Title>
         </div>

         <Title
            size='xs'
            className='sm:text-sm text-black select-none font-bold ml-auto mr-2 absolute end-2 translate-y-0 group-hover:-translate-y-100 transition-all'
         >
            PHP {item.price}
         </Title>

         <div className='flex items-center gap-0.5 sm:gap-1 translate-y-100 group-hover:translate-y-0 transition-all'>
            <SquareMinus
               onClick={() => handleQuantity(true)}
               className='size-4 sm:size-4.5 text-black cursor-pointer hover:text-orange-500'
               strokeWidth={1.5}
            />
            <SquarePlus
               onClick={() => handleQuantity(false)}
               className='size-4 sm:size-4.5 text-black cursor-pointer hover:text-green-500'
               strokeWidth={1.5}
            />
            <Trash2Icon
               onClick={handleRemove}
               className='size-4 sm:size-4.5 text-black cursor-pointer hover:text-red-500'
               strokeWidth={1.5}
            />
         </div>
      </div>
   );
}
