import { Suspense } from 'react';
import ArticlesClient from './ArticlesClient';

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div>Загрузка…</div>}>
      <ArticlesClient />
    </Suspense>
  );
}