// Simplified NetworkFacade and DownloadService for file operations
// These are wrappers around the @internxt/inxt-js functionality

import { AbortableOperation, ProgressCallback } from '../types';

export class NetworkFacade {
  private environment: any;

  constructor(
    _networkModule: any,
    environment: any,
    _downloadService: any,
    _cryptoService: any
  ) {
    this.environment = environment;
  }

  uploadFile(
    stream: any,
    size: number,
    bucket: string,
    callback: (err: Error | null, res?: string) => void,
    progressCallback?: ProgressCallback
  ): any {
    return this.environment.upload(bucket, {
      source: stream,
      fileSize: size,
      finishedCallback: callback,
      progressCallback: progressCallback || (() => { }),
    });
  }

  async downloadToStream(
    bucket: string,
    _mnemonic: string,
    fileId: string,
    fileSize: number,
    writeStream: any,
    _options?: any,
    config?: {
      abortController?: AbortController;
      progressCallback?: ProgressCallback;
    }
  ): Promise<[Promise<void>, AbortableOperation]> {
    const abortController = config?.abortController || new AbortController();
    const progressCallback = config?.progressCallback || (() => { });

    const downloadPromise = new Promise<void>((resolve, reject) => {
      this.environment.download(
        bucket,
        fileId,
        {
          fileSize: fileSize,
          progressCallback: (progress: number) => {
            progressCallback(progress);
          },
          finishedCallback: (err: Error | null, readableStream: any) => {
            if (err) {
              reject(err);
            } else {
              // Pipe the readable stream to the write stream
              readableStream.pipe(writeStream);
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
            }
          },
        },
        {
          label: 'Dynamic',
          params: {
            chunkSize: 4096
          }
        }
      );
    });

    return [
      downloadPromise,
      abortController,
    ];
  }
}
