import React from "react";
import Modal from "@/components/custom/Modal";
import Button from "@/components/custom/Button";
import Title from "@/components/custom/Title";
import Paragraph from "@/components/custom/Paragraph";

const UserCredentialsModal = ({ isOpen, onClose, username, password }) => {
   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         title='User Credentials'
         description='These are the credentials for the user. Please make sure to save them securely.'
         secondaryAction={null}
         contentClassName='my-0'
         primaryAction={{
            label: "Close",
            onClick: onClose,
         }}
      >
         <div className='space-y-4 px-4 py-6 pt-4 bg-card border border-outline rounded mb-2 block'>
            <div>
               <Title size='sm' className='font-medium'>
                  Username:
               </Title>
               <Paragraph size='md' className='bg-white rounded px-3 py-2 mt-1 select-all border border-outline'>
                  {username}
               </Paragraph>
            </div>
            <div>
               <Title size='sm' className='font-medium'>
                  Password:
               </Title>
               <Paragraph size='md' className='bg-white rounded px-3 py-2 mt-1 select-all border border-outline'>
                  {password}
               </Paragraph>
            </div>
         </div>

         <Paragraph className='text-xs text-gray-500 mt-4'>
            Please copy and save these credentials. This is the only time the password will be shown.
         </Paragraph>
      </Modal>
   );
};

export default UserCredentialsModal;
