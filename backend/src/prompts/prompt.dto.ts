import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class ComposePromptDto {
  @IsString()
  @MinLength(3)
  request!: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class CreatePromptDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(3)
  request!: string;

  @IsString()
  @MinLength(3)
  body!: string;
}

export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class DelegatePromptDto {
  @IsArray()
  @IsString({ each: true })
  agents!: string[];

  /** JSON map agentId -> role text */
  @IsString()
  agentRoles!: string;

  @IsIn(["economy", "balanced", "fast"])
  modelTier!: "economy" | "balanced" | "fast";

  @IsString()
  modelId!: string;

  @IsArray()
  @IsString({ each: true })
  publications!: string[];

  @IsBoolean()
  saveToMemory!: boolean;

  @IsArray()
  @IsString({ each: true })
  memoryItems!: string[];

  @IsOptional()
  @IsIn(["urgent", "standard", "background"])
  priority?: "urgent" | "standard" | "background";

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsString()
  inputRef?: string;

  @IsOptional()
  @IsString()
  pdfFileName?: string;

  @IsOptional()
  @IsString()
  outputDir?: string;
}
