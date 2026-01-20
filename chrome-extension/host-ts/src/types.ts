/**
 * Native message types - must match the extension's NativeMessage.ts
 */

export enum NativeMessageType {
  Profile = 'profile',
  Search = 'search',
  Content = 'content',
}

export interface NativeMessage {
  action: 'sendNativeMarkdown';
  url: string;
  type: NativeMessageType;
  content: string;
}

export interface SaveResponse {
  saved: boolean;
  collection_name?: string;
  filename?: string;
  error?: string;
}

export interface MessageResponse {
  message: SaveResponse | string;
}

export interface DocumentMetadata {
  url: string;
  created_at: number;
  content_size_kb: number;
}

export interface CollectionMetadata {
  domain: string;
  description: string;
  created_at: number;
  updated_at?: number;
}
