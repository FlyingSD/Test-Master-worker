/**
 * Plugin Manager
 *
 * Central registry and lifecycle manager for all plugins
 */

import { Plugin, PluginRegistryEntry, PluginAPI } from '@/types/plugin'
import { ComponentType } from 'react'
import toast from 'react-hot-toast'

class PluginManager {
  private plugins: Map<string, PluginRegistryEntry> = new Map()
  private api: PluginAPI

  constructor() {
    // Initialize Plugin API
    this?.api = {
      version: '2.1.0',
      getCurrentUser: () => {
        // Get from auth context
        return null
      },
      registerRoute: (path: string, component: ComponentType) => {
        console.log(`Plugin registered route: ${path}`)
      },
      notify: (message: string, type: 'success' | 'error' | 'info') => {
        if (type === 'success') toast?.success(message)
        else if (type === 'error') toast?.error(message)
        else toast(message)
      },
      storage: {
        get: (key: string) => {
          const data = localStorage?.getItem(`plugin_${key}`)
          return data ? JSON.parse(data) : null
        },
        set: (key: string, value: any) => {
          localStorage?.setItem(`plugin_${key}`, JSON.stringify(value))
        },
        remove: (key: string) => {
          localStorage?.removeItem(`plugin_${key}`)
        },
      },
    }
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin, loader: () => Promise<Plugin>) {
    if (this?.plugins.has(plugin?.id)) {
      console.warn(`Plugin ${plugin?.id} is already registered`)
      return
    }

    this?.plugins.set(plugin?.id, {
      ...plugin,
      loader,
      loaded: false,
    })

    console.log(`✅ Plugin registered: ${plugin?.name} v${plugin?.version}`)
  }

  /**
   * Install a plugin
   */
  async install(pluginId: string): Promise<boolean> {
    const entry = this?.plugins.get(pluginId)
    if (!entry) {
      console.error(`Plugin ${pluginId} not found`)
      return false
    }

    try {
      // Load plugin if not loaded
      if (!entry?.loaded) {
        const plugin = await entry?.loader()
        Object.assign(entry, plugin, { loaded: true })
      }

      // Run onInstall hook
      if (entry?.lifecycle?.onInstall) {
        await entry?.lifecycle.onInstall()
      }

      entry?.installedAt = new Date()

      toast?.success(`Плъгинът "${entry?.name}" е инсталиран успешно!`)
      return true
    } catch (error) {
      console.error(`Failed to install plugin ${pluginId}:`, error)
      toast?.error(`Грешка при инсталиране на "${entry?.name}"`)
      return false
    }
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<boolean> {
    const entry = this?.plugins.get(pluginId)
    if (!entry) {
      console.error(`Plugin ${pluginId} not found`)
      return false
    }

    if (entry?.enabled) {
      console.warn(`Plugin ${pluginId} is already enabled`)
      return true
    }

    try {
      // Load plugin if not loaded
      if (!entry?.loaded) {
        const plugin = await entry?.loader()
        Object.assign(entry, plugin, { loaded: true })
      }

      // Run onEnable hook
      if (entry?.lifecycle?.onEnable) {
        await entry?.lifecycle.onEnable()
      }

      entry?.enabled = true
      entry?.enabledAt = new Date()

      toast?.success(`Плъгинът "${entry?.name}" е активиран!`)
      return true
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error)
      toast?.error(`Грешка при активиране на "${entry?.name}"`)
      return false
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<boolean> {
    const entry = this?.plugins.get(pluginId)
    if (!entry) {
      console.error(`Plugin ${pluginId} not found`)
      return false
    }

    if (!entry?.enabled) {
      console.warn(`Plugin ${pluginId} is already disabled`)
      return true
    }

    try {
      // Run onDisable hook
      if (entry?.lifecycle?.onDisable) {
        await entry?.lifecycle.onDisable()
      }

      entry?.enabled = false

      toast?.success(`Плъгинът "${entry?.name}" е деактивиран!`)
      return true
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error)
      toast?.error(`Грешка при деактивиране на "${entry?.name}"`)
      return false
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<boolean> {
    const entry = this?.plugins.get(pluginId)
    if (!entry) {
      console.error(`Plugin ${pluginId} not found`)
      return false
    }

    try {
      // Disable first if enabled
      if (entry?.enabled) {
        await this?.disable(pluginId)
      }

      // Run onUninstall hook
      if (entry?.lifecycle?.onUninstall) {
        await entry?.lifecycle.onUninstall()
      }

      this?.plugins.delete(pluginId)

      toast?.success(`Плъгинът "${entry?.name}" е деинсталиран!`)
      return true
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error)
      toast?.error(`Грешка при деинсталиране на "${entry?.name}"`)
      return false
    }
  }

  /**
   * Get all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this?.plugins.values())
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): Plugin[] {
    return Array.from(this?.plugins.values()).filter((p) => p?.enabled)
  }

  /**
   * Get a specific plugin
   */
  get(pluginId: string): Plugin | undefined {
    return this?.plugins.get(pluginId)
  }

  /**
   * Get plugin API for use by plugins
   */
  getAPI(): PluginAPI {
    return this?.api
  }
}

// Singleton instance
export const pluginManager = new PluginManager()

// Export type for TypeScript
export type { PluginManager }
