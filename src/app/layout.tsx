import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthContext";
import { ToastProvider } from "@/providers/ToastContext";
import { SocketProvider } from "@/providers/SocketContext";
import "@/bones/registry.js";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Sky-Lite | Construction Management",
  description: "Next-gen construction management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFF] text-gray-900 selection:bg-blue-100 overflow-x-hidden" suppressHydrationWarning>
        {/* Subtle background accent */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-100/30 blur-[120px]" />
        </div>

        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <main className="relative z-0">
                {children}
              </main>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
