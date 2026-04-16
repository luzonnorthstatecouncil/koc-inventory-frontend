import { cn } from "@/lib/utils";

const SummaryFooter = ({ items, className }) => {
	if (!items || items.length === 0) return null;

	return (
		<div className={cn("mt-4 grid gap-3", className)}>
			{items.map((item, index) => (
				<div key={index} className={cn("rounded-xl border px-4 py-3", item.bgColor, item.borderColor)}>
					{item.label && (
						<p className={cn("text-xs font-semibold uppercase tracking-wide mb-1", item.labelColor)}>
							{item.label}
						</p>
					)}
					<p className={cn("text-2xl font-extrabold tabular-nums leading-none", item.valueColor)}>{item.value}</p>
					{item.description && (
						<p className={cn("text-xs mt-1 font-medium opacity-70", item.descriptionColor ?? item.labelColor)}>
							{item.description}
						</p>
					)}
				</div>
			))}
		</div>
	);
};

export default SummaryFooter;

