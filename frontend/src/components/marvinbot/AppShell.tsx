'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/marvinbot/dashboard', label: 'Дашборд' },
  { href: '/marvinbot/sources', label: 'Источники' },
  { href: '/marvinbot/digests', label: 'Дайджесты' },
  { href: '/marvinbot/articles', label: 'Статьи' },
  { href: '/marvinbot/settings', label: 'Настройки' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          MarvinBot <span>Studio</span>
        </div>
        <div className="brand-sub">Модуль Forge Mill · Новосибирск UTC+7</div>
        <nav className="nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname?.startsWith(l.href) ? 'active' : ''}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}