import 'reflect-metadata';
import { BaileysEventMap } from 'baileys';
import { BAILEYS_ON_EVENT } from './metadata';

type EventHandler<K extends keyof BaileysEventMap> = (
  payload: BaileysEventMap[K],
) => void | Promise<void>;

export function On<K extends keyof BaileysEventMap>(event: K) {
  return <T extends EventHandler<K>>(
    _target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> => {
    Reflect.defineMetadata(BAILEYS_ON_EVENT, event, descriptor.value!);
    return descriptor;
  };
}
