"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, CalendarDays } from 'lucide-react';

const AppHeader: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Gestor de horarios UCN</h1>
        </div>
        {isAuthenticated && (
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
