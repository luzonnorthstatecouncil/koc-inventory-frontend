import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children, className = "" }) {
   const location = useLocation();
   const [displayLocation, setDisplayLocation] = useState(location);
   const [transitionStage, setTransitionStage] = useState("fadeIn");

   useEffect(() => {
      if (location !== displayLocation) {
         setTransitionStage("fadeOut");
      }
   }, [location, displayLocation]);

   return (
      <div
         className={`w-full ${transitionStage} ${className}`}
         onAnimationEnd={() => {
            if (transitionStage === "fadeOut") {
               setTransitionStage("fadeIn");
               setDisplayLocation(location);
            }
         }}
      >
         {children}
      </div>
   );
}
