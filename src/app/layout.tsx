import "@/app/global.css";
import { Roboto } from "next/font/google";
import { ThemeContextProvider } from "@components/ThemeContext";
import CustomThemeProvider from "@components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import { MessagesProvider } from "@context/MessageContext";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Chatlink",
  description: "Chat smart. Stay private.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/site.webmanifest",
};

export function generateViewport() {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#1E2428" },
    ],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <ThemeContextProvider>
          <CustomThemeProvider>
            <AuthProvider>
              <MessagesProvider>{children}</MessagesProvider>
            </AuthProvider>
          </CustomThemeProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
