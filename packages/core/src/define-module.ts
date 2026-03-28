import type { ReactiveModuleDescriptor, SlotMap, SlotMapOf } from './types.js'

/**
 * Identity function that provides type inference for module descriptors.
 * Zero runtime overhead — returns its argument unchanged.
 */
export function defineModule<
  TSharedDependencies extends Record<string, any> = Record<string, any>,
  TSlots extends SlotMapOf<TSlots> = SlotMap,
>(
  descriptor: ReactiveModuleDescriptor<TSharedDependencies, TSlots>,
): ReactiveModuleDescriptor<TSharedDependencies, TSlots> {
  return descriptor
}
