export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;
  return (
    <div className="flex items-center gap-3 pt-6 text-sm">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-[var(--text-soft)]">
        Page {page} of {totalPages}
      </span>
      <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
