import { cn } from "@/lib/utils";
import Title from "./Title";
import Paragraph from "./Paragraph";

const SummaryFooter = ({ items, className }) => {
	if (!items || items.length === 0) return null;

	return (
		<div className={cn("mt-4 grid gap-4", className)}>
			{items.map((item, index) => (
				<div key={index} className={cn("p-4 rounded-lg border", item.bgColor, item.borderColor)}>
					{item.label && <Paragraph className={cn("text-sm mb-1", item.labelColor)}>{item.label}</Paragraph>}
					<Title className={cn("text-2xl font-bold", item.valueColor)}>{item.value}</Title>
					{item.description && (
						<Paragraph className={cn("text-xs mt-1", item.descriptionColor)}>{item.description}</Paragraph>
					)}
				</div>
			))}
		</div>
	);
};

export default SummaryFooter;
