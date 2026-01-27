import BaseLayout from "./BaseLayout";

export default function LoginLayout({ children }) {
   return <BaseLayout className='!items-center !justify-center !bg-primary min-h-screen !p-4 sm:!p-6 md:!p-8'>{children}</BaseLayout>;
}
