
"use client";

import type { FC } from 'react';
import DraggableParalelo from './DraggableParalelo';
import type { Paralelo } from '@/services/scheduler';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListFilter, PlusCircle } from 'lucide-react';

interface ParalelosListProps {
  paralelos: Paralelo[];
  isLoading: boolean;
  onDeleteParalelo: (paraleloId: string) => void;
  onCreateParalelo: () => void; // New prop for opening create dialog
}

const ParalelosList: FC<ParalelosListProps> = ({ paralelos, isLoading, onDeleteParalelo, onCreateParalelo }) => {
  if (isLoading) {
    return (
      <Card className="h-full shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-primary" />
            Paralelos Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-2 bg-muted rounded-md animate-pulse">
                <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-1.5"></div>
                <div className="h-2.5 bg-muted-foreground/20 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t mt-auto">
          <Button variant="outline" className="w-full" disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Paralelo
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ListFilter className="h-5 w-5 text-primary" />
          Paralelos Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-hidden">
        {paralelos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay paralelos para la selección actual.</p>
        ) : (
          <ScrollArea className="h-full pr-3">
            <div className="space-y-2">
              {paralelos.map((paralelo) => (
                <DraggableParalelo
                  key={paralelo.id}
                  paralelo={paralelo}
                  onDelete={onDeleteParalelo}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <Button
          variant="outline"
          className="w-full"
          onClick={onCreateParalelo} // Use the new prop
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Paralelo
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ParalelosList;
