
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a more common Material-like font
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// AuthProvider removed from here, will be in specific layouts or MainLayout if needed everywhere authenticated

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Using a more common variable name, can be kept as --font-geist-sans if preferred
});

export const metadata: Metadata = {
  title: 'Gestor de horarios UCN',
  description: 'Drag and Drop Scheduling Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* AuthProvider removed from here */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
