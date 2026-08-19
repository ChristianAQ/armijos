export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-neutral-300 py-12 text-center">
      <p className="font-semibold text-neutral-700">{title}</p>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
}
