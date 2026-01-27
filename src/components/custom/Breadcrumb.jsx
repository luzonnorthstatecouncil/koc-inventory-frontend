import { ChevronDownIcon, SlashIcon } from "lucide-react";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import Each from "./Each";

/**
 * @param {Object[]} items - Array of breadcrumb items
 * Each item: { label: string | JSX.Element, href?: string, options?: Array<{ label, href }> }
 * @param {JSX.Element} separator - optional separator icon
 */
export function IBreadcrumb({ separator = <SlashIcon />, items = [] }) {
	return (
		<Breadcrumb className='mb-3'>
			<BreadcrumbList>
				<Each
					of={items}
					render={(item, index) => (
						<span
							key={index}
							className='flex items-center gap-1'
						>
							<BreadcrumbItem>
								{item.options && item.options.length > 0 ? (
									<DropdownMenu>
										<DropdownMenuTrigger className='flex items-center gap-1 select-none'>
											{item.label}
											<ChevronDownIcon className='size-4' />
										</DropdownMenuTrigger>
										<DropdownMenuContent align='start'>
											{item.options.map((opt, idx) => (
												<DropdownMenuItem key={idx}>
													{opt.href ? (
														<Link href={opt.href}>{opt.label}</Link>
													) : (
														opt.label
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : item.href ? (
									<BreadcrumbLink asChild>
										<Link href={item.href}>{item.label}</Link>
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage
										className={`select-none ${
											index === items.length - 1
												? "text-gray-900"
												: "text-gray-400"
										}`}
									>
										{item.label}
									</BreadcrumbPage>
								)}
							</BreadcrumbItem>

							{/* Separator except after last item */}
							{index < items.length - 1 && (
								<BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
							)}
						</span>
					)}
				/>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
