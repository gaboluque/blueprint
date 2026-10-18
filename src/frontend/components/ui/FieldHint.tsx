type FieldHintProps = {
  children: React.ReactNode;
};

export function FieldHint({ children }: FieldHintProps) {
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}
