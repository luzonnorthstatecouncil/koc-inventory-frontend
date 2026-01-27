import Details from "@/components/custom/Details";
import Modal from "@/components/custom/Modal";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { dateParser } from "@/helpers/parser";
import { useDispatch, useSelector } from "react-redux";

export default function ViewUser({ isOpen, onClose }) {
   const dispatch = useDispatch();
   const { selectedUser } = useSelector((state) => state.user);

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         isLoading={!selectedUser}
         title='User Details'
         description='Detailed information about the user.'
         secondaryAction={null}
         primaryAction={{
            label: "Close",
            onConfirm: onClose,
         }}
      >
         <header className='flex items-center justify-between gap-2'>
            <Title size='2xl'>{selectedUser?.full_name}</Title>
            <Badge variant={selectedUser?.status === "active" ? "success" : "default"} className='capitalize mt-1'>
               {selectedUser?.status}
            </Badge>
         </header>

         <section className='mt-3 grid grid-cols-2 gap-3'>
            <Details label='Email' description={selectedUser?.email} />
            <Details label='Role' description={selectedUser?.role} />
            <Details label='Username' description={selectedUser?.username} />
            <Details label='Date Added' description={dateParser(selectedUser?.created_at)} />
         </section>
      </Modal>
   );
}
