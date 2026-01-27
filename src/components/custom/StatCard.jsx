import ICard from "./Card";
import Paragraph from "./Paragraph";
import Title from "./Title";
import { cn } from "@/lib/utils";

const StatCard = ({ title, subtitle, value, change, icon: Icon, trend, color, bgColor, priority, onClick }) => {
   const cardTitle = (
      <div className='flex flex-row items-center justify-between w-full'>
         <div className='flex'>
            <span className='text-xs sm:text-sm font-medium'>{title}</span>
         </div>
         <div className={cn("rounded-lg", bgColor)}>
            <Icon className={cn("size-4 sm:size-5", color)} />
         </div>
      </div>
   );

   return (
      <ICard
         title={cardTitle}
         description={subtitle}
         onClick={onClick}
         cardClassName={cn(
            "hover:shadow-lg transition-all p-3 sm:p-4 gap-2 md:gap-6",
            onClick && "cursor-pointer",
            priority === "critical" && "border-2 border-orange-500 shadow-md",
         )}
         cardContentClassName='p-0'
         cardHeaderClassName='gap-0 p-0'
         cardTitleClassName='text-xs sm:text-sm font-medium'
      >
         <div>
            <Title className='text-2xl! md:text-2xl font-bold'>{value}</Title>
            <Paragraph
               variant={trend === "up" ? "success" : trend === "down" ? "danger" : "warning"}
               className='text-xs font-medium'
            >
               {change}
            </Paragraph>
         </div>
      </ICard>
   );
};

export default StatCard;
