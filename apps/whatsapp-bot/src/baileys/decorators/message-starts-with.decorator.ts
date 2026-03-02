import 'reflect-metadata';
import {
  BAILEYS_MESSAGE_FILTER,
  BAILEYS_ON_EVENT,
  MessageFilter,
} from './metadata';

export function MessageStartsWith(prefix: string) {
  return <T>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> => {
    const filter: MessageFilter = { type: 'startsWith', value: prefix };
    Reflect.defineMetadata(BAILEYS_MESSAGE_FILTER, filter, descriptor.value!);
    Reflect.defineMetadata(
      BAILEYS_ON_EVENT,
      'messages.upsert',
      descriptor.value!,
    );
    return descriptor;
  };
}
