export default function BaseLayout({ children, className }) {
   return (
      <main
         className={`flex items-start justify-start w-full min-h-screen p-2 md:p-6 bg-background relative ${className}`}
      >
         {children}
      </main>
   );
}
