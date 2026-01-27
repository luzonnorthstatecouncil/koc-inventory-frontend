import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const IProgress = ({
   value = 0,
   max = 100,
   size = "default",
   variant = "default",
   showValue = false,
   label,
   animated = false,
   animationDuration = 500,
   animationDelay = 0,
   className,
   indicatorClassName,
   ...props
}) => {
   const [displayValue, setDisplayValue] = React.useState(animated ? 0 : value);

   // Animation effect
   React.useEffect(() => {
      if (animated && value !== displayValue) {
         const timer = setTimeout(() => {
            setDisplayValue(value);
         }, animationDelay);

         return () => clearTimeout(timer);
      } else if (!animated) {
         setDisplayValue(value);
      }
   }, [value, animated, animationDelay, displayValue]);

   // Calculate percentage
   const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);

   // Size variants
   const sizeClasses = {
      xs: "h-1",
      sm: "h-2",
      default: "h-3",
      lg: "h-4",
      xl: "h-6",
   };

   // Color variants
   const variantClasses = {
      default: "[&>div]:bg-gray-400",
      success: "[&>div]:bg-green-500",
      warning: "[&>div]:bg-yellow-500",
      danger: "[&>div]:bg-red-500",
      info: "[&>div]:bg-blue-500",
   };

   return (
      <div className='w-full space-y-2'>
         {/* Label and value display */}
         {(label || showValue) && (
            <div className='flex justify-between items-center text-sm'>
               {label && <span className='font-medium'>{label}</span>}
               {showValue && (
                  <span className='text-muted-foreground'>
                     {Math.round(displayValue)}/{max}
                  </span>
               )}
            </div>
         )}

         {/* Progress bar */}
         <Progress
            value={percentage}
            className={cn(
               "bg-gray-200",
               sizeClasses[size],
               variantClasses[variant],
               animated && `transition-all duration-${animationDuration}`,
               className
            )}
            {...props}
         />

         {/* Percentage display */}
         {showValue && <div className='text-xs text-center text-muted-foreground'>{Math.round(percentage)}%</div>}
      </div>
   );
};

export default IProgress;
