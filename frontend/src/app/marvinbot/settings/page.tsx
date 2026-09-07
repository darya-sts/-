'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [keywords, setKeywords] = useState('');
  const [chatId, setChatId] = useState('');
  const [newExpert, setNewExpert] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [s, e] = await Promise.all([api('/api/settings'), api('/api/experts')]);
    setSettings(s);
    setKeywords((s.keywords || []).join(', '));
    setChatId(s.telegramChatId || '');
    setExperts(e);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function save() {
    setError('');
    try {
      await api('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          keywords: keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          telegramChatId: chatId,
          scheduleCron: settings?.scheduleCron || '0 6,18 * * *',
          timezone: 'Asia/Novosibirsk',
          categories: settings?.categories || {
            'Инструменты ИИ': 1,
            'Скилы и правила для Агентов': 1,
            'Монетизация с помощью ИИ': 1,
            Прочее: 0.7,
          },
        }),
      });
      setMsg('Настройки сохранены');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function addExpert() {
    if (!newExpert.trim()) return;
    await api('/api/experts', {
      method: 'POST',
      body: JSON.stringify({ name: newExpert.trim() }),
    });
    setNewExpert('');
    await load();
  }

  return (
    <div>
      <h1 className="page-title">Настройки</h1>
      <p className="page-lead">
        Ключевые слова, Telegram chat ID, расписание и список экспертов для метки 🟣 #expert.
      </p>
      {error && <div className="error">{error}</div>}
      {msg && <div className="success">{msg}</div>}

      <div className="panel">
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Ключевые слова (через запятую)</label>
          <textarea rows={3} value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label>Telegram Chat ID</label>
          <input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="123456789" />
        </div>
        <div className="row">
          <div className="field">
            <label>CRON</label>
            <input value={settings?.scheduleCron || '0 6,18 * * *'} readOnly />
          </div>
          <div className="field">
            <label>Часовой пояс</label>
            <input value="Asia/Novosibirsk" readOnly />
          </div>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" onClick={save}>
            Сохранить
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Эксперты</h3>
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="field">
            <label>Имя</label>
            <input value={newExpert} onChange={(e) => setNewExpert(e.target.value)} />
          </div>
          <button className="btn secondary" onClick={addExpert}>
            Добавить
          </button>
        </div>
        <div className="row">
          {experts.map((e) => (
            <span key={e.id} className="badge expert">
              {e.name}
              <button
                className="btn danger"
                style={{ padding: '2px 8px', marginLeft: 6 }}
                onClick={async () => {
                  await api(`/api/experts/${e.id}`, { method: 'DELETE' });
                  await load();
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}