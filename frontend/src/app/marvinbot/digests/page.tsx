'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, formatDate } from '@/lib/api';
import { DigestList } from '@/components/marvinbot/DigestList';

export default function DigestsPage() {
  const [data, setData] = useState<any>({ items: [] });
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setData(await api('/api/digests'));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openDigest(id: string) {
    setError('');
    setMsg('');
    try {
      setSelected(await api(`/api/digests/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggle(itemId: string) {
    if (!selected) return;
    const next = selected.items.map((i: any) =>
      i.id === itemId ? { ...i, selected: !i.selected } : i,
    );
    const ids = next.filter((i: any) => i.selected).map((i: any) => i.id);
    const updated = await api(`/api/digests/${selected.id}/select`, {
      method: 'POST',
      body: JSON.stringify({ itemIds: ids }),
    });
    setSelected(updated);
  }

  async function generate() {
    if (!selected) return;
    setError('');
    try {
      const article = await api(`/api/digests/${selected.id}/approve`, { method: 'POST' });
      setMsg(`Статья создана: ${article.title} (${article.tokensUsed} токенов)`);
      await openDigest(selected.id);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 className="page-title">Дайджесты</h1>
      <p className="page-lead">
        История сводок и выбор постов для статьи (дублирует Telegram inline-кнопки).
      </p>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="grid" style={{ gridTemplateColumns: '0.9fr 1.1fr', marginTop: 12 }}>
        <div className="panel">
          <DigestList items={data.items || []} onOpen={openDigest} />
        </div>
        <div className="panel">
          {!selected && <div style={{ color: 'var(--muted)' }}>Выберите дайджест слева</div>}
          {selected && (
            <>
              <h3>
                {formatDate(selected.date)} · <span className="badge">{selected.status}</span>
              </h3>
              {selected.items.map((item: any) => (
                <div
                  key={item.id}
                  className={`digest-item ${item.selected ? 'selected' : ''}`}
                  onClick={() => toggle(item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>
                      {item.selected ? '✅' : '⬜'} [{item.order}]{' '}
                      {(item.post.summary || item.post.text).slice(0, 90)}
                    </strong>
                    {item.post.isExpert && <span className="badge expert">🟣 #expert</span>}
                  </div>
                  <div style={{ color: 'var(--muted)', marginTop: 6, fontSize: '0.9rem' }}>
                    📌 {item.post.category} | @{item.post.source.username} · score {item.post.score}
                  </div>
                </div>
              ))}
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" onClick={generate}>
                  🚀 Сгенерировать статью
                </button>
                {selected.article && (
                  <Link className="btn secondary" href={`/marvinbot/articles?id=${selected.article.id}`}>
                    Открыть статью
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}