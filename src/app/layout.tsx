import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Theatre Play Coach",
  description: "Your personal rehearsal companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
