import { Ban } from "lucide-react";

export default function Fallback({ message = "Nothing to display", className = "" }) {
   return (
      <div className={`flex flex-col items-center justify-center p-5 h-full w-full ${className}`}>
         <Ban className='text-gray-400/60 size-9 mb-1' />
         <p className='text-sm text-gray-400/60 font-semibold'>{message}</p>
      </div>
   );
}
