'use client';

import { useEffect, useState } from 'react';
import { api, formatDate } from '@/lib/api';
import { TokenUsageChart } from '@/components/marvinbot/TokenUsageChart';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [tokens, setTokens] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const [dash, tok] = await Promise.all([
        api('/api/stats/dashboard'),
        api('/api/stats/tokens?days=14'),
      ]);
      setData(dash);
      setTokens(tok);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runDigest() {
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const digest = await api('/api/digests/generate', { method: 'POST' });
      setMsg(`Дайджест создан: ${digest.items?.length || 0} постов`);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">MarvinBot Studio</h1>
      <p className="page-lead">
        Сводка по сбору Telegram-каналов, дайджестам и расходу токенов. Расписание: 06:00 и
        18:00 Asia/Novosibirsk.
      </p>

      <div className="row" style={{ marginBottom: 20 }}>
        <button className="btn" onClick={runDigest} disabled={busy}>
          {busy ? 'Собираем…' : 'Сгенерировать дайджест сейчас'}
        </button>
        <button className="btn secondary" onClick={load}>
          Обновить
        </button>
      </div>
      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="grid stats" style={{ marginTop: 20 }}>
        <div className="panel">
          <h3>Статьи за неделю</h3>
          <div className="stat-value">{data?.articlesWeek ?? '—'}</div>
        </div>
        <div className="panel">
          <h3>Активные источники</h3>
          <div className="stat-value">{data?.sourcesActive ?? '—'}</div>
        </div>
        <div className="panel">
          <h3>Дайджестов всего</h3>
          <div className="stat-value">{data?.digestsTotal ?? '—'}</div>
        </div>
        <div className="panel">
          <h3>Токены за неделю</h3>
          <div className="stat-value">{data?.tokensWeek ?? '—'}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', marginTop: 16 }}>
        <div className="panel">
          <h3>Использование токенов</h3>
          <TokenUsageChart series={tokens?.series || []} />
          {tokens && (
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 28 }}>
              Факт: {tokens.total} · без оптимизации ≈ {tokens.baselineWithoutOptimization} ·
              экономия ~{tokens.savingsPercent}%
            </p>
          )}
        </div>
        <div className="panel">
          <h3>Последние дайджесты</h3>
          {(data?.recentDigests || []).map((d: any) => (
            <div key={d.id} style={{ marginBottom: 12 }}>
              <div>{formatDate(d.date)}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {d.status} · {d.items?.length || 0} постов
                {d.article ? ` · статья: ${d.article.title}` : ''}
              </div>
            </div>
          ))}
          {!data?.recentDigests?.length && (
            <div style={{ color: 'var(--muted)' }}>Пока пусто — запустите сбор.</div>
          )}
        </div>
      </div>
    </div>
  );
}