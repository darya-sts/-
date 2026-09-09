import { Injectable } from "@nestjs/common";
import {
  ArchitectureConfig,
  ArchitectureGraph,
  getCachedArchitecture,
  loadArchitectureConfig,
  runArchitectureScan,
  saveArchitectureConfig,
} from "./scanner";

@Injectable()
export class ArchitectureService {
  async scan(): Promise<ArchitectureGraph> {
    return runArchitectureScan();
  }

  async getData(): Promise<ArchitectureGraph> {
    const cached = getCachedArchitecture();
    if (cached) return cached;
    return runArchitectureScan();
  }

  getSettings(): ArchitectureConfig {
    return loadArchitectureConfig();
  }

  saveSettings(config: ArchitectureConfig): ArchitectureConfig {
    return saveArchitectureConfig(config);
  }
}
