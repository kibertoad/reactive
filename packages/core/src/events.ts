import { createContext, useContext } from 'react'

/**
 * Augment this interface in your modules to get typed events:
 *
 * @example
 * declare module '@reactive/core' {
 *   interface ReactiveEventMap {
 *     'billing:invoice-paid': { invoiceId: string; amount: number }
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReactiveEventMap {}

type EventHandler<T = unknown> = (payload: T) => void

export interface EventBus {
  emit<K extends keyof ReactiveEventMap>(event: K, payload: ReactiveEventMap[K]): void
  emit(event: string, payload?: unknown): void

  on<K extends keyof ReactiveEventMap>(
    event: K,
    handler: EventHandler<ReactiveEventMap[K]>,
  ): () => void
  on(event: string, handler: EventHandler): () => void

  once<K extends keyof ReactiveEventMap>(
    event: K,
    handler: EventHandler<ReactiveEventMap[K]>,
  ): () => void
  once(event: string, handler: EventHandler): () => void
}

export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<EventHandler>>()

  function getListeners(event: string): Set<EventHandler> {
    let set = listeners.get(event)
    if (!set) {
      set = new Set()
      listeners.set(event, set)
    }
    return set
  }

  return {
    emit(event: string, payload?: unknown) {
      const set = listeners.get(event)
      if (set) {
        for (const handler of set) {
          handler(payload)
        }
      }
    },

    on(event: string, handler: EventHandler): () => void {
      const set = getListeners(event)
      set.add(handler)
      return () => {
        set.delete(handler)
      }
    },

    once(event: string, handler: EventHandler): () => void {
      const wrapper: EventHandler = (payload) => {
        set.delete(wrapper)
        handler(payload)
      }
      const set = getListeners(event)
      set.add(wrapper)
      return () => {
        set.delete(wrapper)
      }
    },
  }
}

export const EventBusContext = createContext<EventBus | null>(null)

export function useEventBus(): EventBus {
  const bus = useContext(EventBusContext)
  if (!bus) {
    throw new Error(
      '[@reactive/core] useEventBus must be used within a <ReactiveApp />.',
    )
  }
  return bus
}
