// Simplified NetworkFacade and DownloadService for file operations
// These are wrappers around the @internxt/inxt-js functionality

import { ProgressCallback, AbortableOperation } from '../types';

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
    return this.environment.upload(stream, {
      progressCallback: progressCallback || (() => {}),
      bucketId: bucket,
      fileSize: size,
      finishedCallback: callback,
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
    const progressCallback = config?.progressCallback || (() => {});

    const downloadPromise = this.environment.download(
      fileId,
      {
        bucketId: bucket,
        fileSize: fileSize,
        progressCallback: (progress: number) => {
          progressCallback(progress);
        },
        writeStream: writeStream,
      }
    );

    return [
      downloadPromise,
      abortController,
    ];
  }
}
