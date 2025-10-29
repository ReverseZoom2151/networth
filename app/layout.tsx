import type { Metadata } from "next";
import "./globals.css";
import { WhopProvider } from "./providers";

export const metadata: Metadata = {
  title: "Networth - Your Personal AI Financial Coach",
  description: "Get personalized financial advice powered by AI. Achieve your money goals faster with daily tips, goal tracking, and 24/7 support.",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WhopProvider>
          {children}
        </WhopProvider>
      </body>
    </html>
  );
}
