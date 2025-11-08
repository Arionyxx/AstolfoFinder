interface FormErrorProps {
  message?: string;
}

export default function FormError({ message }: FormErrorProps): JSX.Element | null {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
      <p className="text-sm">{message}</p>
    </div>
  );
}
