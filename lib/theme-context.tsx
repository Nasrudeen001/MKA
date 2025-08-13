"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "green" | "blue" | "purple" | "orange" | "red" | "teal"

export type ColorScheme = {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
}

const themes: Record<Theme, ColorScheme> = {
  light: {
    primary: "rgb(34 197 94)", // green-500
    secondary: "rgb(59 130 246)", // blue-500
    accent: "rgb(16 185 129)", // emerald-500
    background: "rgb(255 255 255)", // white
    foreground: "rgb(15 23 42)", // slate-900
    muted: "rgb(248 250 252)", // slate-50
  },
  dark: {
    primary: "rgb(34 197 94)", // green-500
    secondary: "rgb(59 130 246)", // blue-500
    accent: "rgb(16 185 129)", // emerald-500
    background: "rgb(15 23 42)", // slate-900
    foreground: "rgb(248 250 252)", // slate-50
    muted: "rgb(30 41 59)", // slate-800
  },
  green: {
    primary: "rgb(34 197 94)", // green-500
    secondary: "rgb(22 163 74)", // green-600
    accent: "rgb(16 185 129)", // emerald-500
    background: "rgb(240 253 244)", // green-50
    foreground: "rgb(20 83 45)", // green-900
    muted: "rgb(220 252 231)", // green-100
  },
  blue: {
    primary: "rgb(59 130 246)", // blue-500
    secondary: "rgb(29 78 216)", // blue-700
    accent: "rgb(14 165 233)", // sky-500
    background: "rgb(239 246 255)", // blue-50
    foreground: "rgb(30 58 138)", // blue-900
    muted: "rgb(219 234 254)", // blue-100
  },
  purple: {
    primary: "rgb(147 51 234)", // purple-500
    secondary: "rgb(126 34 206)", // purple-600
    accent: "rgb(168 85 247)", // purple-400
    background: "rgb(250 245 255)", // purple-50
    foreground: "rgb(59 7 100)", // purple-900
    muted: "rgb(243 232 255)", // purple-100
  },
  orange: {
    primary: "rgb(249 115 22)", // orange-500
    secondary: "rgb(234 88 12)", // orange-600
    accent: "rgb(251 146 60)", // orange-400
    background: "rgb(255 247 237)", // orange-50
    foreground: "rgb(124 45 18)", // orange-900
    muted: "rgb(254 215 170)", // orange-200
  },
  red: {
    primary: "rgb(239 68 68)", // red-500
    secondary: "rgb(220 38 38)", // red-600
    accent: "rgb(248 113 113)", // red-400
    background: "rgb(254 242 242)", // red-50
    foreground: "rgb(127 29 29)", // red-900
    muted: "rgb(254 202 202)", // red-200
  },
  teal: {
    primary: "rgb(20 184 166)", // teal-500
    secondary: "rgb(13 148 136)", // teal-600
    accent: "rgb(45 212 191)", // teal-400
    background: "rgb(240 253 250)", // teal-50
    foreground: "rgb(19 78 74)", // teal-900
    muted: "rgb(204 251 241)", // teal-100
  },
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  colors: ColorScheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("mka-theme") as Theme
    if (savedTheme && savedTheme in themes) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("mka-theme", theme)

    // Apply CSS variables to root
    const root = document.documentElement
    const colors = themes[theme]

    root.style.setProperty("--theme-primary", colors.primary)
    root.style.setProperty("--theme-secondary", colors.secondary)
    root.style.setProperty("--theme-accent", colors.accent)
    root.style.setProperty("--theme-background", colors.background)
    root.style.setProperty("--theme-foreground", colors.foreground)
    root.style.setProperty("--theme-muted", colors.muted)

    // Update body class for theme-specific styles
    document.body.className = document.body.className.replace(/theme-\w+/g, "")
    document.body.classList.add(`theme-${theme}`)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, colors: themes[theme] }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
