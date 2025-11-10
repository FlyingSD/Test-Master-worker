/**
 * Sample Plugin
 *
 * Example plugin demonstrating the plugin API
 */

import { Plugin } from '@/types/plugin'
import { Star } from 'lucide-react'

// Sample dashboard widget
function SampleWidget() {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Star className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Sample Plugin Widget</h3>
      </div>
      <p className="text-gray-600 text-sm">
        This is a sample widget from the example plugin.
        It demonstrates how plugins can add custom widgets to the dashboard.
      </p>
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⭐ You can add any React component here!
        </p>
      </div>
    </div>
  )
}

// Sample settings panel
function SampleSettings() {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sample Setting
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Enter value..."
        />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded" />
          <span className="text-sm text-gray-700">Enable feature</span>
        </label>
      </div>
      <button className="btn btn-primary">
        Save Settings
      </button>
    </div>
  )
}

// Plugin definition
export const samplePlugin: Plugin = {
  id: 'sample-plugin',
  name: 'Sample Plugin',
  description: 'An example plugin demonstrating the plugin API capabilities',
  version: '1.0.0',
  author: 'Svetlinki CRM',
  icon: '⭐',
  enabled: false,

  lifecycle: {
    onInstall: async () => {
      console.log('Sample plugin installed')
    },
    onEnable: async () => {
      console.log('Sample plugin enabled')
    },
    onDisable: async () => {
      console.log('Sample plugin disabled')
    },
    onUninstall: async () => {
      console.log('Sample plugin uninstalled')
    },
  },

  menuItems: [
    {
      label: 'Sample Page',
      path: '/plugins/sample',
      icon: <Star className="w-5 h-5" />,
      requiresAdmin: false,
    },
  ],

  widgets: [
    {
      id: 'sample-widget',
      title: 'Sample Widget',
      component: SampleWidget,
      size: 'medium',
      order: 10,
    },
  ],

  settings: {
    component: SampleSettings,
    title: 'Sample Plugin Settings',
    description: 'Configure the sample plugin',
  },
}

// Export default for dynamic import
export default samplePlugin
