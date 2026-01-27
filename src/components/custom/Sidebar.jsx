import { Item } from "../ui/item";

export default function ISidebar({ items, active, className, itemClassName }) {
   return (
      <div className={`border-r border-outline/60 w-44 pr-3 ${className}`}>
         {items?.map((item, index) => (
            <Item
               onClick={item.action}
               className={`p-1 cursor-pointer hover:bg-sidebar-accent select-none ${
                  active === item.key ? "font-semibold" : "text-gray-400"
               } ${itemClassName}`}
               key={index}
            >
               {item.label}
            </Item>
         ))}
      </div>
   );
}
