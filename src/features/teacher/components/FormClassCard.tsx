interface FormClassCardProps {
  formClass: string | null;
}

export const FormClassCard = ({ formClass }: FormClassCardProps) => {
  if (!formClass) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
      <p className="text-sm text-gray-400">Class Teacher</p>
      <p className="text-xl font-bold text-gray-800 mt-1">{formClass}</p>
    </div>
  );
};
