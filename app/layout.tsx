import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import { FolderKanban, Search } from "lucide-react";

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
  title: "ArchSync",
  description: "Architecture documentation and search platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100`}
      >
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-6 border-b border-gray-800">
              <h1 className="text-2xl font-bold text-white">ArchSync</h1>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <FolderKanban className="w-5 h-5" />
                    <span>Projects</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "bg-gray-800 text-gray-100",
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
