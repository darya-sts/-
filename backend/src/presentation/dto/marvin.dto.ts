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
