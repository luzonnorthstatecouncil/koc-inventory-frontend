import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const AnimatedNumber = ({
   value,
   duration = 500,
   prefix = "",
   suffix = "",
   decimals = 2,
   className = "",
   ...props
}) => {
   const [displayValue, setDisplayValue] = useState(0);
   const [isAnimating, setIsAnimating] = useState(false);
   const [isIncreasing, setIsIncreasing] = useState(true);
   const animationRef = useRef(null);
   const startTimeRef = useRef(null);
   const startValueRef = useRef(0);

   const easeOutQuart = (t) => {
      return 1 - Math.pow(1 - t, 4);
   };

   const animate = (timestamp) => {
      if (!startTimeRef.current) {
         startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = startValueRef.current + (value - startValueRef.current) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
         animationRef.current = requestAnimationFrame(animate);
      } else {
         setDisplayValue(value);
         setIsAnimating(false);
         startTimeRef.current = null;
      }
   };

   useEffect(() => {
      if (value !== displayValue) {
         setIsAnimating(true);
         setIsIncreasing(value > displayValue);
         startValueRef.current = displayValue;
         startTimeRef.current = null;

         if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
         }

         animationRef.current = requestAnimationFrame(animate);
      }

      return () => {
         if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
         }
      };
      // Only a new target value restarts the animation; adding displayValue/animate would
      // restart it on every frame it renders.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [value]);

   useEffect(() => {
      return () => {
         if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
         }
      };
   }, []);

   const formatNumber = (num) => {
      return parseFloat(num).toLocaleString("en-US", {
         minimumFractionDigits: decimals,
         maximumFractionDigits: decimals,
      });
   };

   return (
      <span
         className={cn(
            "inline-block transition-all duration-200",
            isAnimating &&
               displayValue !== 0 && ["scale-105 font-semibold", isIncreasing ? "text-green-600" : "text-red-600"],
            className
         )}
         {...props}
      >
         {prefix}
         {formatNumber(displayValue)}
         {suffix}
      </span>
   );
};

export default AnimatedNumber;
