'use client';

import { formatDate } from '@/lib/api';

export function DigestList({
  items,
  onOpen,
}: {
  items: any[];
  onOpen: (id: string) => void;
}) {
  if (!items.length) {
    return <div style={{ color: 'var(--muted)' }}>Дайджестов пока нет</div>;
  }
  return (
    <div>
      {items.map((d) => (
        <button
          key={d.id}
          className="btn secondary"
          style={{ width: '100%', marginBottom: 8, textAlign: 'left', borderRadius: 12 }}
          onClick={() => onOpen(d.id)}
        >
          <div>{formatDate(d.date)}</div>
          <div style={{ fontWeight: 500, color: 'var(--muted)', fontSize: '0.85rem' }}>
            {d.status} · {d.items?.length || 0} постов
            {d.article ? ` · ${d.article.title}` : ''}
          </div>
        </button>
      ))}
    </div>
  );
}