import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";
import { isConvexConfigured } from "@cemvp/convex-client";
import { AppAuthProvider, AuthModal, OfflineAuthProvider } from "@cemvp/auth-ui";
import { ConvexProvider } from "@/providers/convex-provider";
import { ForumProfileEnsurer } from "@/providers/forum-profile-ensurer";
import { SharedDataProvider } from "@/providers/shared-data-context";
import { ThemeProvider } from "@/providers/theme-provider";
import { NavigationProgressProvider } from "@/providers/navigation-progress-provider";
import { NavigationProgressBar } from "@/components/ui/navigation-progress-bar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Createconomy",
  description: "Where AI Creates Value",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const convexConfigured = isConvexConfigured();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NavigationProgressProvider>
            <NavigationProgressBar />
            <ConvexProvider>
            {convexConfigured ? (
              <AppAuthProvider>
                <SharedDataProvider>
                  <ForumProfileEnsurer />
                  {children}
                  <AuthModal />
                </SharedDataProvider>
              </AppAuthProvider>
            ) : (
              <OfflineAuthProvider>
                <SharedDataProvider>
                  {children}
                  <AuthModal />
                </SharedDataProvider>
              </OfflineAuthProvider>
            )}
          </ConvexProvider>
          </NavigationProgressProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
