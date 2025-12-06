'use client'

import { useEffect, useState, useCallback } from 'react'

const THEME_KEY = 'theme'

export function ThemeProvider({ children }) {
  // This component only ensures the initial theme is applied on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (stored === 'light') {
        document.documentElement.classList.remove('dark')
      }
    } catch (e) {
      // ignore
    }
  }, [])

  return children
}

export function useTheme() {
  // Initialize as 'light' to ensure server and initial client render match.
  // We'll read the persisted value and update after mount to avoid hydration
  // mismatches when localStorage contains a different theme.
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored) {
        setTheme(stored)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem(THEME_KEY, 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem(THEME_KEY, 'light')
      }
    } catch (e) {
      // ignore
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, setTheme, toggle }
}

export default ThemeProvider
