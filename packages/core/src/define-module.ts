import type { ReactiveModuleDescriptor } from './types.js'

/**
 * Identity function that provides type inference for module descriptors.
 * Zero runtime overhead — returns its argument unchanged.
 */
export function defineModule<
  TSharedDependencies extends Record<string, any> = Record<string, any>,
>(
  descriptor: ReactiveModuleDescriptor<TSharedDependencies>,
): ReactiveModuleDescriptor<TSharedDependencies> {
  return descriptor
}
