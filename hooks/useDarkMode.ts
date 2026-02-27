import { useState, useEffect } from 'react';

export const useDarkMode = () => {
    const [isDark, setIsDark] = useState<boolean>(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.remove('light');
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggle = () => setIsDark(prev => !prev);

    return { isDark, toggle };
};
