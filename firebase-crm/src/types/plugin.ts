/**
 * Plugin System Types
 *
 * Defines the plugin architecture for extensibility
 */

import { ReactNode } from 'react'

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /** Called when plugin is first installed */
  onInstall?: () => void | Promise<void>

  /** Called when plugin is enabled */
  onEnable?: () => void | Promise<void>

  /** Called when plugin is disabled */
  onDisable?: () => void | Promise<void>

  /** Called when plugin is uninstalled */
  onUninstall?: () => void | Promise<void>
}

/**
 * Plugin menu item for navigation
 */
export interface PluginMenuItem {
  label: string
  path: string
  icon?: ReactNode
  requiresAdmin?: boolean
}

/**
 * Plugin dashboard widget
 */
export interface PluginWidget {
  id: string
  title: string
  component: React?.ComponentType
  size?: 'small' | 'medium' | 'large'
  order?: number
}

/**
 * Plugin settings panel
 */
export interface PluginSettings {
  component: React?.ComponentType
  title: string
  description?: string
}

/**
 * Main Plugin interface
 */
export interface Plugin {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Short description */
  description: string

  /** Plugin version (semver) */
  version: string

  /** Plugin author */
  author: string

  /** Author website/email */
  authorUrl?: string

  /** Plugin icon (emoji or icon component) */
  icon?: string | ReactNode

  /** Minimum CRM version required (semver) */
  minVersion?: string

  /** Maximum CRM version supported (semver) */
  maxVersion?: string

  /** Plugin lifecycle hooks */
  lifecycle?: PluginLifecycle

  /** Navigation menu items added by plugin */
  menuItems?: PluginMenuItem[]

  /** Dashboard widgets provided by plugin */
  widgets?: PluginWidget[]

  /** Settings panel for plugin configuration */
  settings?: PluginSettings

  /** Whether plugin is enabled */
  enabled: boolean

  /** Installation date */
  installedAt?: Date

  /** Last enabled date */
  enabledAt?: Date
}

/**
 * Plugin manifest (package?.json format)
 */
export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  main: string
  keywords?: string[]
  license?: string
  repository?: string
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry extends Plugin {
  /** Load function to lazy load plugin code */
  loader: () => Promise<Plugin>

  /** Whether plugin is currently loaded */
  loaded: boolean
}

/**
 * Plugin API context passed to plugins
 */
export interface PluginAPI {
  /** CRM version */
  version: string

  /** Get current user */
  getCurrentUser: () => any

  /** Register custom route */
  registerRoute: (path: string, component: React?.ComponentType) => void

  /** Add notification */
  notify: (message: string, type: 'success' | 'error' | 'info') => void

  /** Get/set plugin data in localStorage */
  storage: {
    get: (key: string) => any
    set: (key: string, value: any) => void
    remove: (key: string) => void
  }
}
