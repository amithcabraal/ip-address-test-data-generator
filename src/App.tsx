import { useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeModal } from './components/WelcomeModal';
import { IPRangeProcessor } from './components/IPRangeProcessor';
import { useThemeStore } from './stores/themeStore';
import { useWelcomeStore } from './stores/welcomeStore';

function App() {
  const { theme } = useThemeStore();
  const { showWelcome } = useWelcomeStore();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">IP Address Generator</h1>
        <IPRangeProcessor />
      </main>
      {showWelcome && <WelcomeModal />}
    </div>
  );
}

export default App;