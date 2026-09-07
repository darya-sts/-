'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, formatDate } from '@/lib/api';
import { ArticleViewer } from '@/components/marvinbot/ArticleViewer';

export default function ArticlesClient() {
  const params = useSearchParams();
  const focusId = params.get('id');
  const [data, setData] = useState<any>({ items: [] });
  const [current, setCurrent] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function open(id: string) {
    const article = await api(`/api/articles/${id}`);
    setCurrent(article);
    setEditTitle(article.title);
    setEditContent(article.content);
  }

  async function load() {
    const list = await api('/api/articles');
    setData(list);
    const id = focusId || list.items?.[0]?.id;
    if (id) await open(id);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const tokensLabel = useMemo(
    () => (current ? `${current.tokensUsed} токенов · ${current.content?.length || 0} символов` : ''),
    [current],
  );

  async function save() {
    if (!current) return;
    setError('');
    try {
      const updated = await api(`/api/articles/${current.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      setCurrent({ ...current, ...updated });
      setMsg('Сохранено');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function publish() {
    if (!current) return;
    await api(`/api/articles/${current.id}/publish`, { method: 'POST' });
    setMsg('Опубликовано');
    await open(current.id);
    await load();
  }

  return (
    <div>
      <h1 className="page-title">Статьи</h1>
      <p className="page-lead">Просмотр и ручное редактирование перед публикацией.</p>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="grid" style={{ gridTemplateColumns: '0.8fr 1.2fr', marginTop: 12 }}>
        <div className="panel">
          {(data.items || []).map((a: any) => (
            <button
              key={a.id}
              className="btn secondary"
              style={{ width: '100%', marginBottom: 8, textAlign: 'left', borderRadius: 12 }}
              onClick={() => open(a.id)}
            >
              <div>{a.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                {formatDate(a.createdAt)} · {a.status} · {a.tokensUsed} tok
              </div>
            </button>
          ))}
          {!data.items?.length && <div style={{ color: 'var(--muted)' }}>Статей пока нет</div>}
        </div>

        <div className="panel">
          {!current && <div style={{ color: 'var(--muted)' }}>Выберите статью</div>}
          {current && (
            <>
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="badge">{current.status}</span>
                <span className="badge">{tokensLabel}</span>
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Заголовок</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>Markdown</label>
                <textarea
                  rows={12}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
              <div className="row" style={{ marginBottom: 16 }}>
                <button className="btn" onClick={save}>
                  Сохранить
                </button>
                <button className="btn secondary" onClick={publish}>
                  Опубликовать
                </button>
              </div>
              <ArticleViewer content={editContent} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}