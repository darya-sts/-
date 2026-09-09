import { Body, Controller, Get, Put, Post } from "@nestjs/common";
import { ArchitectureService } from "./architecture.service";
import type { ArchitectureConfig } from "./scanner";

@Controller("api/architecture")
export class ArchitectureController {
  constructor(private readonly architecture: ArchitectureService) {}

  /** Запуск полного сканирования. */
  @Post("scan")
  scan() {
    return this.architecture.scan();
  }

  /** Последний кэш / автоскан. */
  @Get("data")
  data() {
    return this.architecture.getData();
  }

  @Get("settings")
  settings() {
    return this.architecture.getSettings();
  }

  @Put("settings")
  saveSettings(@Body() body: ArchitectureConfig) {
    return this.architecture.saveSettings(body);
  }
}
