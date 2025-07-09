// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Roboto } from "next/font/google";
import CustomThemeProvider from "@components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider"; // We'll create this component

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <CustomThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}
