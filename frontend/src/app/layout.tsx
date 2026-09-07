import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/marvinbot/AppShell';

export const metadata: Metadata = {
  title: 'MarvinBot Studio · Forge Mill',
  description: 'Сбор, анализ и генерация статей из Telegram-каналов',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}