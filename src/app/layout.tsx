import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ThemeContextProvider } from "@components/ThemeContext";
import CustomThemeProvider from "@components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chatlink",
  description: "Build with NextJS",
};

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
            <AuthProvider>{children}</AuthProvider>
          </CustomThemeProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
