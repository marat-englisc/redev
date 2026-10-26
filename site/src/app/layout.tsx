import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { StoreProvider } from "@/store/provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { CommandMenu } from "@/components/command-menu";
import { PwaRegister } from "@/components/pwa";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: { default: BRAND.title, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <StoreProvider>
            <TooltipProvider delay={300}>
              <SiteHeader />
              <div className="flex-1 flex flex-col">{children}</div>
              <CommandMenu />
              <Toaster position="bottom-center" />
              <PwaRegister />
            </TooltipProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
