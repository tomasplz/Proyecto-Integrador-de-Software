
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { Semestre } from '@/services/scheduler';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarRange } from 'lucide-react';

interface SemesterSelectorProps {
  semestres: Semestre[];
  selectedSemestreId: string;
  onSelectSemester: (semesterId: string) => void;
  isLoading: boolean;
  className?: string; // Allow className to be passed
}

const SemesterSelector: FC<SemesterSelectorProps> = ({
  semestres,
  selectedSemestreId,
  onSelectSemester,
  isLoading,
  className,
}) => {
  if (isLoading) {
    return (
      <Card className={cn("shadow-lg", className)}> {/* Removed mt-6, use passed className */}
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Seleccionar Semestre
          </CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-2 p-4 overflow-x-auto">
          {[...Array(10)].map((_, index) => (
            <Skeleton key={index} className="h-10 w-16 rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!semestres || semestres.length === 0) {
    return (
       <Card className={cn("shadow-lg", className)}> {/* Removed mt-6, use passed className */}
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            Seleccionar Semestre
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
            <p className="text-muted-foreground text-center">No hay semestres disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-lg", className)}> {/* Removed mt-6, use passed className */}
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          Seleccionar Semestre
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {semestres.map((semestre) => (
            <Button
              key={semestre.id}
              variant={selectedSemestreId === semestre.id ? 'default' : 'outline'}
              onClick={() => onSelectSemester(semestre.id)}
              className={cn(
                "h-10 w-16 text-sm font-medium transition-all duration-150 ease-in-out",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selectedSemestreId === semestre.id 
                  ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                  : 'hover:bg-accent/80 hover:text-accent-foreground'
              )}
              aria-pressed={selectedSemestreId === semestre.id}
              aria-label={`Seleccionar ${semestre.name}`}
            >
              {semestre.name.replace('Semestre ', '')}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SemesterSelector;

