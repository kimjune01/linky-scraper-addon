// pages/content/src/OutgoingMessage.ts

export enum NativeMessageType {
  Profile = 'profile',
  Search = 'search',
  Content = 'content',
}

export type NativeMessage = {
  action: 'sendNativeMarkdown';
  filename: string;
  type: NativeMessageType;
  content: string;
};
