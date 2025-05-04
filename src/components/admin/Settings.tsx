import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export function AdminSettings() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-brand-primary" />
        <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">System configuration options will be implemented here.</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Email notification settings will be implemented here.</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">Security and access control settings will be implemented here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}