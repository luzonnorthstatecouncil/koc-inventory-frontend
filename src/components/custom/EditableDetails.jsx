import Details from "./Details";
import IInput from "./Input";

export default function EditableDetails({ label, description, isEdit = false, name, value }) {
   return isEdit ? (
      <IInput
         inputWrapperClassName='w-1/3'
         name={name}
         label={label}
         placeholder={`Enter ${label.toLowerCase()}`}
      />
   ) : (
      <Details label={label} description={description} />
   );
}
