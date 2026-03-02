import { BaileysEventMap, WAMessage } from 'baileys';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  BAILEYS_ON_EVENT,
  BAILEYS_MESSAGE_FILTER,
  MessageFilter,
} from './decorators/metadata';

type BaileysEventHandler = (...args: unknown[]) => void | Promise<void>;

interface MessagesUpsertPayload {
  type: 'append' | 'notify';
  messages: WAMessage[];
}

export class BaileysDispatcher {
  private readonly providerInstances: object[];

  constructor(providers: InstanceWrapper[]) {
    this.providerInstances = providers
      .map((wrapper) => wrapper.instance as object | null | undefined)
      .filter(
        (instance): instance is object =>
          instance !== null && instance !== undefined,
      );
  }

  dispatch<K extends keyof BaileysEventMap>(
    eventName: K,
    payload: BaileysEventMap[K],
  ): void {
    for (const provider of this.providerInstances) {
      const prototype = Object.getPrototypeOf(provider) as object;

      for (const methodName of Object.getOwnPropertyNames(prototype)) {
        const handler = (provider as Record<string, unknown>)[methodName];
        if (typeof handler !== 'function') continue;

        const event = Reflect.getMetadata(BAILEYS_ON_EVENT, handler) as
          | keyof BaileysEventMap
          | undefined;
        if (event !== eventName) continue;

        // message filter: pass single msg to handler, validate type === 'notify'
        const filter = Reflect.getMetadata(BAILEYS_MESSAGE_FILTER, handler) as
          | MessageFilter
          | undefined;
        if (filter && eventName === 'messages.upsert') {
          const payloadTyped = payload as unknown as MessagesUpsertPayload;
          if (payloadTyped.type !== 'notify') continue;

          for (const msg of payloadTyped.messages ?? []) {
            if (!this.matchMessageFilter(msg, filter)) continue;
            (handler as BaileysEventHandler).call(provider, msg);
          }
          continue;
        }

        (handler as BaileysEventHandler).call(provider, payload);
      }
    }
  }

  private matchMessageFilter(msg: WAMessage, filter: MessageFilter): boolean {
    const text =
      msg.message?.conversation ?? msg.message?.extendedTextMessage?.text;

    if (!text) return false;

    if (filter.type === 'startsWith') {
      return text.startsWith(filter.value);
    }

    return true;
  }
}
