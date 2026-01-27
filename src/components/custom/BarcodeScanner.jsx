import { useZxing } from "react-zxing";
import Title from "./Title";
import { useDispatch, useSelector } from "react-redux";
import { setBarcodeActive, setBarcodeValue, setEnableBarcodeScanner } from "@/features/slice/barcodeSlice";
import { Dot } from "lucide-react";
import { toast } from "sonner";
import Paragraph from "./Paragraph";
import { useState, useEffect } from "react";
import IButton from "./Button";

function BarcodeScanner({ className }) {
   const dispatch = useDispatch();
   const [permissionState, setPermissionState] = useState("pending");

   const { ref } = useZxing({
      paused: false,
      constraints: {
         video: {
            facingMode: "environment",
            width: { min: 1280 },
            height: { min: 1024 },
         },
      },
      onDecodeResult: (result) => {
         const code = result.getText();
         dispatch(setBarcodeValue(code));
         toast.success(`Scanned barcode: ${code}`);
      },
      onError: (error) => {
         if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
            setPermissionState("denied");
            toast.error("Camera access denied. Please grant permission to use the barcode scanner.");
         } else {
            toast.error("Failed to access camera. Please check your device settings.");
         }

         dispatch(setBarcodeActive(false));
         dispatch(setEnableBarcodeScanner(false));
      },
   });

   useEffect(() => {
      const video = ref.current;
      if (!video) return;

      const checkStream = () => {
         if (video.srcObject && video.srcObject.active) {
            setPermissionState("granted");
         }
      };

      checkStream();
      video.addEventListener("loadedmetadata", checkStream);

      return () => {
         video.removeEventListener("loadedmetadata", checkStream);
      };
   }, [ref]);

   const handleScanError = () => {
      dispatch(setBarcodeValue(""));
      dispatch(setBarcodeActive(false));
   };

   return (
      <div className={className}>
         {permissionState === "denied" && (
            <>
               <Title size='xs' className='!text-red-600'>
                  Camera Access Denied
               </Title>
               <Paragraph>
                  The barcode scanner needs camera access to work. Please grant camera permission in your browser
                  settings.
               </Paragraph>
            </>
         )}

         {permissionState === "pending" && (
            <>
               <Title size='xs' className='flex items-center !text-yellow-600 -mb-1'>
                  <Dot className='-mr-1 -ml-2 animate-pulse' /> Requesting Camera Access...
               </Title>
               <Paragraph>Please allow camera access when prompted by your browser.</Paragraph>
            </>
         )}

         {permissionState === "granted" && (
            <>
               <Title size='xs' className='flex items-center !text-green-600 -mb-1'>
                  <Dot className='-mr-1 -ml-2' /> Barcode Scanner Active
               </Title>
               <Paragraph>Point your barcode at the camera to scan it.</Paragraph>
            </>
         )}

         <video ref={ref} className='w-full border border-outline hidden' onError={handleScanError} />
      </div>
   );
}

export default BarcodeScanner;
