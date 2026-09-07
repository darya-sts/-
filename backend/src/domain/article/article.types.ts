export type ArticleStatus = "draft" | "published" | "archived";

export interface MarvinArticleEntity {
  id: string;
  title: string;
  content: string;
  query: string;
  tags: string[];
  status: ArticleStatus;
  tokenUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarvinSettingsEntity {
  id: string;
  skills: string;
  rules: string;
  telegramSources: string;
  updatedAt: Date;
}

export interface GenerateRequest {
  query: string;
  context?: string;
  articleId?: string;
  chatMessage?: string;
}

export interface GenerateResult {
  title: string;
  contentHtml: string;
  tags: string[];
  tokenUsed: number;
  qualityPassed: boolean;
  qualityNotes: string[];
}
