export const BAILEYS_ON_EVENT = 'BAILEYS_ON_EVENT';
export const BAILEYS_MESSAGE_FILTER = 'BAILEYS_MESSAGE_FILTER';

export interface MessageFilter {
  type: 'startsWith';
  value: string;
}
