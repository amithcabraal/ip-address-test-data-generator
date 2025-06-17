import { useThemeStore } from '../stores/themeStore';

export const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="mt-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
};