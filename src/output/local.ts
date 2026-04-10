import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { OutputResult, OutputStrategy } from '../types/index.js';

export class LocalOutput implements OutputStrategy {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? tmpdir();
  }

  async write(buffer: Buffer, filename: string): Promise<OutputResult> {
    const filePath = join(this.baseDir, filename);
    await writeFile(filePath, buffer);
    return {
      path: filePath,
      fileSize: buffer.length,
    };
  }

  async cleanup(id: string): Promise<void> {
    try {
      await unlink(id);
    } catch {
      // File may already be cleaned up
    }
  }
}
