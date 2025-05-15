
"use client";

import type { FC } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '@/lib/dnd';
import type { Paralelo } from '@/services/scheduler';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';

interface DraggableParaleloProps {
  paralelo: Paralelo;
  onDelete?: (paraleloId: string) => void; // Optional: only if delete functionality is desired from list
}

const DraggableParalelo: FC<DraggableParaleloProps> = ({ paralelo, onDelete }) => {
  const [{ isDragging }, drag, preview] = useDrag(() => ({ // Added preview
    type: ItemTypes.PARALELO,
    item: { id: paralelo.id, type: ItemTypes.PARALELO, paralelo },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={preview} className={`mb-2 transition-opacity duration-150 ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}`}>
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-card text-xs">
        <CardHeader className="p-2 flex-row justify-between items-center">
          <div ref={drag} className="flex items-center flex-grow cursor-grab overflow-hidden pr-1"> {/* Drag handle here */}
            <GripVertical className="h-5 w-5 text-muted-foreground mr-1 flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
                <CardTitle className="text-xs font-medium truncate">{paralelo.asignatura}</CardTitle>
                {/* NRC Description removed as requested, as it defaults to "NA" */}
                {/* <CardDescription className="text-xs mt-0.5">NRC: {paralelo.nrc}</CardDescription> */}
            </div>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click or other parent events
                onDelete(paralelo.id);
              }}
              aria-label={`Eliminar paralelo ${paralelo.asignatura}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <p className="text-xs text-muted-foreground truncate">
            Prof: {paralelo.professor || 'N/A'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DraggableParalelo;
