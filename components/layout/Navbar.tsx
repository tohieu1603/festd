'use client';

import { Menu, Moon, Sun, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Menu button (mobile only) */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-gray-900" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

          {/* User menu */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {user.full_name || 'Administrator'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                  {user.role || 'Admin'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {(user.full_name || 'A')[0].toUpperCase()}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
