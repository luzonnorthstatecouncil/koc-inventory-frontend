import Form from "@/components/custom/Form";
import PageLayout from "@/layout/PageLayout";
import IInput from "@/components/custom/Input";
import { HOME, SETTINGS } from "@/constants/routes";
import { searchSchema } from "@/lib/zod/schema/search";
import { SearchIcon } from "lucide-react";

const breadcrumbItems = [
	{ label: HOME.title },
	{ label: SETTINGS.title },
];

export default function Settings() {
	const onSubmit = (data) => console.log(data);

	return (
		<PageLayout breadcrumbItems={breadcrumbItems} route={SETTINGS}>
			<Form
				onSubmit={onSubmit}
				schema={searchSchema}
				mode='onChange'
				debounce={0.5}
				className='w-full sm:w-96 md:w-100'
			>
				<IInput
					preventEnterSubmit
					name='search'
					placeholder='Search'
					prefix={<SearchIcon className='size-4' />}
					className='w-full'
				/>
			</Form>
		</PageLayout>
	);
}
