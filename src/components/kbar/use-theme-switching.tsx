import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';
import { useThemeConfig } from '@/components/themes/active-theme';
import { THEMES } from '@/components/themes/theme.config';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();
  const { activeTheme, setActiveTheme } = useThemeConfig();

  const toggleDarkLight = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.value === activeTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setActiveTheme(THEMES[nextIndex].value);
  };

  const themeActions = [
    {
      id: 'cycleTheme',
      name: 'Đổi giao diện',
      shortcut: ['t', 't'],
      section: 'Giao diện',
      perform: cycleTheme
    },
    {
      id: 'toggleDarkLight',
      name: 'Đổi sáng/tối',
      shortcut: ['d', 'd'],
      section: 'Giao diện',
      perform: toggleDarkLight
    },
    {
      id: 'setLightTheme',
      name: 'Dùng giao diện sáng',
      section: 'Giao diện',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Dùng giao diện tối',
      section: 'Giao diện',
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeActions, [theme, activeTheme]);
};

export default useThemeSwitching;
