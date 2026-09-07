'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function SourceManager({
  categories,
  onCreated,
  onError,
}: {
  categories: string[];
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [weight, setWeight] = useState(3);
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState('');

  async function test() {
    setBusy(true);
    onError('');
    try {
      const res = await api('/api/sources/test', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      setTestResult(res.ok ? `OK: ${res.title}` : `Ошибка: ${res.error}`);
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    onError('');
    try {
      await api('/api/sources', {
        method: 'POST',
        body: JSON.stringify({ username, category, weight }),
      });
      setUsername('');
      setTestResult('');
      onCreated();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3>Добавить канал</h3>
      <div className="row">
        <div className="field">
          <label>@username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="openai" />
        </div>
        <div className="field">
          <label>Категория</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Вес (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn secondary" onClick={test} disabled={busy || !username}>
          Тест-драйв
        </button>
        <button className="btn" onClick={create} disabled={busy || !username}>
          Добавить
        </button>
        {testResult && <span style={{ color: 'var(--muted)' }}>{testResult}</span>}
      </div>
    </div>
  );
}