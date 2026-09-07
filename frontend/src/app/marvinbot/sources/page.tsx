'use client';

import { useEffect, useState } from 'react';
import { api, CATEGORIES, formatDate } from '@/lib/api';
import { SourceManager } from '@/components/marvinbot/SourceManager';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setSources(await api('/api/sources'));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Источники</h1>
      <p className="page-lead">
        Добавляйте публичные Telegram-каналы по @username. Парсинг — через public API / Telethon.
      </p>
      {error && <div className="error">{error}</div>}
      <SourceManager
        categories={[...CATEGORIES]}
        onCreated={load}
        onError={setError}
      />

      <div className="panel" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Канал</th>
              <th>Категория</th>
              <th>Вес</th>
              <th>Статус</th>
              <th>Последний парсинг</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>@{s.username}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{s.title}</div>
                </td>
                <td>{s.category}</td>
                <td>{s.weight}</td>
                <td>
                  <span className={`badge ${s.isActive ? 'ok' : 'warn'}`}>
                    {s.isActive ? 'активен' : 'выкл'}
                  </span>
                </td>
                <td>{s.lastParsed ? formatDate(s.lastParsed) : '—'}</td>
                <td>
                  <div className="row">
                    <button
                      className="btn secondary"
                      onClick={async () => {
                        await api(`/api/sources/${s.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({ isActive: !s.isActive }),
                        });
                        load();
                      }}
                    >
                      Toggle
                    </button>
                    <button
                      className="btn secondary"
                      onClick={async () => {
                        const res = await api(`/api/sources/${s.id}/parse`, { method: 'POST' });
                        alert(JSON.stringify(res, null, 2));
                        load();
                      }}
                    >
                      Проверить сейчас
                    </button>
                    <button
                      className="btn danger"
                      onClick={async () => {
                        await api(`/api/sources/${s.id}`, { method: 'DELETE' });
                        load();
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}