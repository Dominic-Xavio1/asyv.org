"use client";

import { useEffect } from "react";

export default function LoginLayout({ children }) {
  useEffect(() => {
    // Signal CSS to hide global nav
    document.body.setAttribute("data-hide-nav", "true");
    // Ensure mobile scroll isn't affected
    document.body.style.overflow = "auto";
    return () => {
      document.body.removeAttribute("data-hide-nav");
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="login-fullscreen bg-muted dark:bg-gray-900 flex w-full items-center justify-center">
      {children}
    </div>
  );
}
