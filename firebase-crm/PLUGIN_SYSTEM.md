# 🔌 Plugin System Documentation

## Overview

Svetlinki CRM includes an extensible plugin system that allows developers to add custom functionality without modifying the core codebase.

## Architecture

### Components

1. **Plugin Types** (`src/types/plugin.ts`)
   - `Plugin` - Main plugin interface
   - `PluginLifecycle` - Lifecycle hooks (install, enable, disable, uninstall)
   - `PluginMenuItem` - Navigation menu items
   - `PluginWidget` - Dashboard widgets
   - `PluginSettings` - Settings panel
   - `PluginAPI` - API provided to plugins

2. **Plugin Manager** (`src/lib/pluginManager.ts`)
   - Central registry for all plugins
   - Lifecycle management
   - Enable/disable functionality
   - Plugin API provision

3. **Sample Plugin** (`src/plugins/samplePlugin.tsx`)
   - Example implementation
   - Demonstrates all features

## Creating a Plugin

### Basic Structure

```typescript
import { Plugin } from '@/types/plugin'

export const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  description: 'Description of what the plugin does',
  version: '1.0.0',
  author: 'Your Name',
  icon: '🎉',
  enabled: false,

  lifecycle: {
    onInstall: async () => {
      // Runs when plugin is first installed
    },
    onEnable: async () => {
      // Runs when plugin is enabled
    },
    onDisable: async () => {
      // Runs when plugin is disabled
    },
    onUninstall: async () => {
      // Runs when plugin is uninstalled
    },
  },

  menuItems: [
    {
      label: 'My Page',
      path: '/plugins/my-plugin',
      icon: <MyIcon />,
    },
  ],

  widgets: [
    {
      id: 'my-widget',
      title: 'My Widget',
      component: MyWidgetComponent,
      size: 'medium',
    },
  ],

  settings: {
    component: MySettingsComponent,
    title: 'My Plugin Settings',
  },
}

export default myPlugin
```

### Plugin Properties

- **id**: Unique identifier (required)
- **name**: Display name (required)
- **description**: Short description (required)
- **version**: Semver version string (required)
- **author**: Author name (required)
- **icon**: Emoji or React component
- **enabled**: Whether plugin is active
- **minVersion/maxVersion**: CRM version compatibility

### Lifecycle Hooks

```typescript
lifecycle: {
  onInstall: async () => {
    // Initialize plugin data
    // Create database collections
    // Set default settings
  },

  onEnable: async () => {
    // Start background tasks
    // Register event listeners
  },

  onDisable: async () => {
    // Stop background tasks
    // Clean up listeners
  },

  onUninstall: async () => {
    // Remove plugin data
    // Clean up database
  },
}
```

### Adding Menu Items

```typescript
menuItems: [
  {
    label: 'Reports',
    path: '/plugins/my-plugin/reports',
    icon: <BarChart className="w-5 h-5" />,
    requiresAdmin: true, // Only admins can see
  },
]
```

### Dashboard Widgets

```typescript
function MyWidget() {
  return (
    <div className="card">
      <h3>My Custom Widget</h3>
      <p>Widget content here...</p>
    </div>
  )
}

widgets: [
  {
    id: 'my-widget',
    title: 'My Widget',
    component: MyWidget,
    size: 'large', // 'small' | 'medium' | 'large'
    order: 5, // Display order
  },
]
```

### Settings Panel

```typescript
function MySettings() {
  const [enabled, setEnabled] = useState(false)

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable Feature
      </label>
    </div>
  )
}

settings: {
  component: MySettings,
  title: 'Plugin Configuration',
  description: 'Configure plugin behavior',
}
```

## Plugin API

Plugins have access to the Plugin API for interacting with the CRM:

```typescript
import { pluginManager } from '@/lib/pluginManager'

const api = pluginManager.getAPI()

// Get CRM version
console.log(api.version)

// Get current user
const user = api.getCurrentUser()

// Register custom route
api.registerRoute('/custom', MyComponent)

// Show notifications
api.notify('Success!', 'success')
api.notify('Error!', 'error')
api.notify('Info', 'info')

// Storage (localStorage-based)
api.storage.set('myKey', { data: 'value' })
const data = api.storage.get('myKey')
api.storage.remove('myKey')
```

## Registering a Plugin

### Option 1: Auto-registration

Create your plugin in `src/plugins/` directory and import in main.tsx:

```typescript
import { pluginManager } from '@/lib/pluginManager'
import myPlugin from '@/plugins/myPlugin'

pluginManager.register(myPlugin, () => import('@/plugins/myPlugin'))
```

### Option 2: Dynamic registration

```typescript
pluginManager.register(myPlugin, async () => {
  const module = await import('@/plugins/myPlugin')
  return module.default
})
```

## Managing Plugins

```typescript
import { pluginManager } from '@/lib/pluginManager'

// Install plugin
await pluginManager.install('my-plugin')

// Enable plugin
await pluginManager.enable('my-plugin')

// Disable plugin
await pluginManager.disable('my-plugin')

// Uninstall plugin
await pluginManager.uninstall('my-plugin')

// Get all plugins
const allPlugins = pluginManager.getAll()

// Get enabled plugins
const enabledPlugins = pluginManager.getEnabled()

// Get specific plugin
const plugin = pluginManager.get('my-plugin')
```

## Best Practices

1. **Use unique IDs** - Use reverse domain notation (e.g., `com.company.plugin-name`)
2. **Version properly** - Follow semantic versioning (semver)
3. **Clean up** - Always clean up in `onDisable` and `onUninstall` hooks
4. **Error handling** - Wrap async operations in try-catch
5. **Test thoroughly** - Test install/enable/disable/uninstall cycles
6. **Document well** - Provide clear README for your plugin
7. **Minimal dependencies** - Avoid heavy dependencies
8. **Respect permissions** - Check user roles before showing admin features

## Example Plugins

### 1. Statistics Plugin

```typescript
export const statsPlugin: Plugin = {
  id: 'stats-dashboard',
  name: 'Advanced Statistics',
  description: 'Advanced analytics and reporting',
  version: '1.0.0',
  author: 'Stats Team',

  widgets: [{
    id: 'stats-widget',
    title: 'Statistics Overview',
    component: StatsWidget,
    size: 'large',
  }],
}
```

### 2. Export Plugin

```typescript
export const exportPlugin: Plugin = {
  id: 'advanced-export',
  name: 'Advanced Export',
  description: 'Export data in multiple formats',
  version: '1.0.0',
  author: 'Export Team',

  menuItems: [{
    label: 'Export Center',
    path: '/plugins/export',
    icon: <Download />,
  }],
}
```

## Future Enhancements

- [ ] Plugin marketplace
- [ ] NPM package support
- [ ] Remote plugin loading
- [ ] Plugin sandboxing
- [ ] Permission system
- [ ] Plugin dependencies
- [ ] Auto-updates
- [ ] Plugin analytics

## Support

For plugin development support:
- Check the sample plugin: `src/plugins/samplePlugin.tsx`
- Read the type definitions: `src/types/plugin.ts`
- Contact: developer@svetlinki.com
