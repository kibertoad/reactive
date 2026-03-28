import { createContext, useContext } from 'react'
import type { ModuleEntry } from './types.js'

export const ModulesContext = createContext<readonly ModuleEntry[] | null>(null)

/**
 * Access the list of registered modules with their metadata and components.
 * Must be used within a <ReactiveApp /> provider tree.
 *
 * Use this to build discovery UIs (directory pages, search, catalogs)
 * and to render module components in workspace tabs or panels.
 *
 * @example
 * const modules = useModules()
 * const journeys = modules.filter(m => m.meta?.category === 'payments')
 *
 * @example
 * const mod = modules.find(m => m.id === activeTab.moduleId)
 * if (mod?.component) return <mod.component {...props} />
 */
export function useModules(): readonly ModuleEntry[] {
  const modules = useContext(ModulesContext)
  if (!modules) {
    throw new Error(
      '[@reactive-framework/registry] useModules must be used within a <ReactiveApp />.',
    )
  }
  return modules
}
