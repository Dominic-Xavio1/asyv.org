import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/layout/navagation";
import NotificationManager from '@/components/NotificationManager'
import ChatNotificationManager from '@/components/ChatNotificationManager'
import MobileBottomNav from "@/components/MobileBottomNav";
import QuickLinksMenu from "@/components/QuickLinksMenu";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks"
import { Providers } from "./provider"
import { GoogleProvider } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import ThemeProvider from '@/lib/theme'
import AuthProvider from '@/components/auth/AuthProvider'
import AuthGate from '@/components/auth/AuthGate'
import AIChatWidget from '@/components/chat/AIChatWidget'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
// const pacifico = Pacifico({
//   weight: '100',
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-pacifico', 
// });
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
        <GoogleProvider>
          <Providers>
            <ThemeProvider>
              <AuthProvider>
                <AuthGate />
                <Toaster position="top-right" />
                <NavBar />
                <NotificationManager />
                <ChatNotificationManager />
                {children}
                <MobileBottomNav />
                <QuickLinksMenu />
                <AIChatWidget />
                {/* <FireworksBackground /> */}
              </AuthProvider>
            </ThemeProvider>
          </Providers>
        </GoogleProvider>
      </body>
    </html>
  )
}
if (process.env.NODE_ENV === "development") {
  const originalError = console.error

  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered two children with the same key")) {
      throw new Error(args[0])
    }
    originalError(...args)
  }
}
