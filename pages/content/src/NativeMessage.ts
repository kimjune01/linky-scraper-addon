// pages/content/src/NativeMessage.ts

export enum NativeMessageType {
  Profile = 'profile',
  Search = 'search',
  Content = 'content',
}

export type NativeMessage = {
  action: 'sendNativeMarkdown';
  url: string;
  type: NativeMessageType;
  content: string;
};
