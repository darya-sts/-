'use client';

export function TokenUsageChart({ series }: { series: Array<{ date: string; tokens: number }> }) {
  const max = Math.max(1, ...series.map((s) => s.tokens));
  if (!series.length) {
    return <div style={{ color: 'var(--muted)', padding: '24px 0' }}>Нет данных по токенам</div>;
  }
  return (
    <div className="chart">
      {series.map((s) => (
        <div
          key={s.date}
          className="bar"
          style={{ height: `${Math.max(8, (s.tokens / max) * 100)}%` }}
          title={`${s.date}: ${s.tokens}`}
        >
          <span>{s.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}