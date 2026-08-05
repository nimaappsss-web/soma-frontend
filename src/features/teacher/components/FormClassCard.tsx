interface FormClassCardProps {
  formClass: string | null;
}

export const FormClassCard = ({ formClass }: FormClassCardProps) => {
  if (!formClass) return null;

  return (
    <div className="bg-white rounded-xl border border-gray100 p-5 mb-4">
      <p className="text-xs font-medium text-gray500">Class Teacher</p>
      <p className="text-xl font-bold text-gray900 mt-1">{formClass}</p>
    </div>
  );
};
