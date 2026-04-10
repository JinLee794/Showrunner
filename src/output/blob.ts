import type { OutputResult, OutputStrategy } from '../types/index.js';

/**
 * Azure Blob Storage output strategy (M4).
 * Uploads rendered videos to Azure Blob Storage and returns SAS-signed URLs.
 */
export class BlobOutput implements OutputStrategy {
  constructor(_connectionString?: string, _containerName?: string) {
    // Placeholder for M4 implementation
  }

  async write(_buffer: Buffer, _filename: string): Promise<OutputResult> {
    throw new Error('BlobOutput is not yet implemented. Use LocalOutput for stdio transport.');
  }

  async cleanup(_id: string): Promise<void> {
    throw new Error('BlobOutput is not yet implemented.');
  }
}
