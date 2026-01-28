"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a placeholder with the same dimensions to avoid layout shift
        return (
            <div className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
        );
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`
        fixed bottom-5 right-5 z-50
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg
        transition-all duration-300 ease-in-out
        cursor-pointer
        ${isDark
                    ? "bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-yellow-300 hover:text-yellow-200"
                    : "bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-gray-900 hover:text-gray-800"
                }
        hover:scale-110 hover:shadow-xl
        active:scale-95
        border-2 ${isDark ? "border-indigo-400/30" : "border-amber-300/50"}
      `}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <div className="relative w-6 h-6">
                {/* Sun icon - visible in dark mode */}
                <Sun
                    className={`
            absolute inset-0 w-6 h-6
            transition-all duration-300 ease-in-out
            ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}
          `}
                />
                {/* Moon icon - visible in light mode */}
                <Moon
                    className={`
            absolute inset-0 w-6 h-6
            transition-all duration-300 ease-in-out
            ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}
          `}
                />
            </div>
        </button>
    );
}
