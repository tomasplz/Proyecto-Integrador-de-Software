
"use client";

import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth, AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import AppHeader from '@/components/AppHeader';
// Toaster is now in RootLayout

const MainLayoutContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a redirect component, but router.push handles it
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </DndProvider>
  );
};


export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider> {/* Wrap MainLayoutContent with AuthProvider */}
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthProvider>
  );
}
