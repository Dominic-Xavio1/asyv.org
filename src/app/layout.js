import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/layout/navagation";
import {Providers} from "./provider"
import {Toaster} from 'react-hot-toast'
import ThemeProvider from '@/lib/theme'
import AuthProvider from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata = {
  title: "asyv.org Platform",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen`}
      >
        <Providers>
          <ThemeProvider>
            <AuthProvider>
              <Toaster position="top-right" />
              <NavBar />
              <AuthGate />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
