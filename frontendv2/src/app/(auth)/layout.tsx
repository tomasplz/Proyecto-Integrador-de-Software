
"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // AuthProvider is now specific to auth routes or in RootLayout if global
  return <AuthProvider>{children}</AuthProvider>;
}
