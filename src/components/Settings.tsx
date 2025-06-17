import { type FC, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: FC<SettingsProps> = ({ onClose }) => {
  const { apiKey, setApiKey } = useSettingsStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(tempApiKey);
    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
      
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          FindIP API Key
        </label>
        <input
          type="text"
          id="apiKey"
          value={tempApiKey}
          onChange={(e) => setTempApiKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Enter your API key"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
        >
          Save
        </button>
      </div>
    </div>
  );
};