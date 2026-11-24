import { LockIcon, MailIcon } from "lucide-react";
import { loginSchema } from "@/lib/zod/schema/login";
import ICard from "@/components/custom/Card";
import IInput from "@/components/custom/Input";
import LoginLayout from "@/layout/LoginLayout";
import IButton from "@/components/custom/Button";
import Form from "@/components/custom/Form";
import { useSignInUserMutation } from "@/features/api/auth";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import IAlert from "@/components/custom/Alert";
import { useNavigate } from "react-router-dom";
import { setUser } from "@/features/slice/userSlice";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { resetAuthState } from "@/lib/utils";
import LogoWordmark from "@/assets/images/logos/logo_wordmark_white.png";

export default function Login() {
   const [error, setError] = useState(null);
   const navigate = useNavigate();
   const dispatch = useDispatch();

   const exec = useCatchQuery();
   const [signIn] = useSignInUserMutation();

   const auth = useUser();

   useEffect(() => {
      if (auth) navigate("/");
   }, [auth, navigate]);

   const onSubmit = async (data) => {
      setError(null);
      const id = toast.loading("Signing you in...");

      const { success, result, message } = await exec(signIn, data);

      if (!success) {
         toast.dismiss(id);
         setError(message);
         return;
      }

      if (result.token && result.user) {
         toast.dismiss(id);
         localStorage.setItem("token", result.token);
         resetAuthState(); // Reset unauthorized state on successful login
         dispatch(setUser(result));
         navigate("/sales", { replace: true });
      }
   };

   return (
      <LoginLayout>
         <section className='flex flex-col lg:flex-row items-center mx-auto gap-6 sm:gap-8 lg:gap-12 px-4 sm:px-6 lg:pr-24 mb-12 lg:mb-0 w-full max-w-screen-xl'>
            <img
               src={LogoWordmark}
               alt='Logo Emblem'
               className='w-64 sm:w-80 lg:w-150 h-auto mx-auto md:mb-2'
            />
            <ICard
               title='Sales & Inventory'
               description='Enter your credentials to access your account'
               cardClassName='text-start w-full sm:w-96 lg:w-100 bg-white text-primary'
               cardTitleClassName='text-xl sm:text-2xl lg:text-3xl font-extrabold!'
            >
               <Form className='flex flex-col gap-4' onSubmit={onSubmit} schema={loginSchema}>
                  <IInput
                     name='username'
                     placeholder='Username'
                     prefix={<MailIcon className='size-4 text-black' />}
                  />
                  <IInput
                     name='password'
                     type='password'
                     placeholder='Password'
                     prefix={<LockIcon className='size-4 text-black' />}
                  />
                  <IButton type='submit' variant='emphasis' className='w-full'>
                     Sign In
                  </IButton>

                  {error && <IAlert description={error} />}
               </Form>
            </ICard>
         </section>
      </LoginLayout>
   );
}
