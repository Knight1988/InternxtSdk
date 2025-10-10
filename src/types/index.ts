/**
 * Type definitions for Internxt SDK
 */

export interface SDKConfig {
  apiUrl?: string;
  networkUrl?: string;
  appCryptoSecret?: string;
  clientName?: string;
  clientVersion?: string;
}

export interface AppDetails {
  clientName: string;
  clientVersion: string;
}

export interface User {
  email: string;
  uuid: string;
  rootFolderId: string;
  bridgeUser: string;
  userId: string;
  bucket: string;
  mnemonic: string;
  createdAt: string;
  [key: string]: any;
}

export interface Credentials {
  user: User;
  token: string;
  lastLoggedInAt: string;
  lastTokenRefreshAt?: string;
}

export interface LoginResult {
  success: boolean;
  user: {
    email: string;
    uuid: string;
    rootFolderId: string;
    [key: string]: any;
  };
  token?: string;
  mnemonic?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  parentId: string;
}

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  folderId: string;
}

export interface FolderContents {
  folders: Folder[];
  files: File[];
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  folderId: string;
  bucket?: string;
  fileId?: string;
  modificationTime?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  folderId: string;
}

export interface DownloadedFile {
  path: string;
  name: string;
  size: number;
}

export interface OperationResult {
  success: boolean;
  id: string;
  name?: string;
  newParentId?: string;
  newFolderId?: string;
}

export interface CryptoProvider {
  encryptPasswordHash(password: string, encryptedSalt: string): string;
  generateKeys(password: string): Promise<GeneratedKeys>;
}

export interface GeneratedKeys {
  privateKeyEncrypted: string;
  publicKey: string;
  revocationCertificate: string;
  ecc: {
    privateKeyEncrypted: string;
    publicKey: string;
  };
  kyber: {
    privateKeyEncrypted: string | null;
    publicKey: string | null;
  };
}

export interface HashObject {
  salt: string;
  hash: string;
}

export interface KeyAndIv {
  key: Buffer;
  iv: Buffer;
}

export type ProgressCallback = (progress: number) => void;

export interface NetworkCredentials {
  user: string;
  pass: string;
}

export interface UploadOptions {
  progressCallback?: ProgressCallback;
  bucketId: string;
  fileSize: number;
  finishedCallback: (error: Error | null, result?: string) => void;
}

export interface DownloadOptions {
  bucketId: string;
  fileSize: number;
  progressCallback?: ProgressCallback;
  writeStream: WritableStream;
}

export interface WritableStream {
  write: (chunk: Buffer) => Promise<void>;
  close: () => Promise<void>;
}

export interface AbortableOperation {
  abort: (reason?: string) => void;
}
