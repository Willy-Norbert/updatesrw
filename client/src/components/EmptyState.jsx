export default function EmptyState({ title, body, action }) {
  return (
    <div className="py-16 border-y border-[var(--border)]">
      <h2 className="text-xl m-0">{title}</h2>
      {body ? <p className="text-[var(--text-soft)] mt-2 mb-0 max-w-xl">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
