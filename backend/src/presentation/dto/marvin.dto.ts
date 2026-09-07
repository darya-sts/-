import { IsOptional, IsString, MinLength } from "class-validator";

export class GenerateDto {
  @IsString()
  @MinLength(3)
  query!: string;

  @IsOptional()
  @IsString()
  context?: string;
}

export class ChatEditDto {
  @IsString()
  articleId!: string;

  @IsString()
  @MinLength(2)
  message!: string;
}

export class UpdateSkillsDto {
  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  telegramSources?: string;
}

export class AnalyzeTelegramDto {
  @IsOptional()
  channels?: string[];
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class InsertMediaDto {
  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  alt?: string;
}
