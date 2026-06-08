import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Service-Pal | Expert Local Home Services & Repair Marketplace",
  description: "Find and book local service experts for home cleaning, plumbing, electrical work, AC repair, and gardening. Trusted local pros, real reviews, instant online booking.",
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
