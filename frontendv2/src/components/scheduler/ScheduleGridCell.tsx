
"use client";

import type { FC } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '@/lib/dnd';
import type { AsignacionHorario, Paralelo, Sala } from '@/services/scheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, CheckCircle, BookOpen, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScheduleGridCellProps {
  bloqueHorarioId: string;
  day: string;
  assignments: (AsignacionHorario & { paraleloDetails?: Paralelo; salaDetails?: Sala })[];
  onDropParalelo: (paraleloId: string, bloqueHorarioId: string, day: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
}

const ScheduleGridCell: FC<ScheduleGridCellProps> = ({
  bloqueHorarioId,
  day,
  assignments,
  onDropParalelo,
  onRemoveAssignment,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.PARALELO,
    drop: (item: { id: string }) => onDropParalelo(item.id, bloqueHorarioId, day),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const isActive = isOver && canDrop;
  let backgroundColor = 'bg-background hover:bg-muted/50 transition-colors duration-150';
  if (isActive) {
    backgroundColor = 'bg-accent/20';
  } else if (canDrop) {
    backgroundColor = 'bg-muted/30';
  }
  
  const hasAssignments = assignments && assignments.length > 0;
  const cellHeight = hasAssignments ? 'min-h-[120px]' : 'min-h-[100px]'; // Adjusted min-height

  const ariaLabel = `Horario para ${day}, bloque ${bloqueHorarioId}. ${
    hasAssignments
      ? `${assignments.length} asignacion(es): ${assignments.map(a => a.paraleloDetails?.asignatura || 'N/A').join(', ')}`
      : 'Vacío, arrastre un paralelo aquí.'
  }`;

  return (
    <div
      ref={drop}
      className={cn(
        'border border-border rounded-md p-1.5 flex flex-col justify-start items-center text-center relative', // Reduced padding
        backgroundColor,
        cellHeight,
        'transition-all duration-200 ease-in-out transform hover:scale-[1.02]',
        'h-auto' 
      )}
      style={{ boxShadow: isActive ? '0 0 0 2px hsl(var(--accent))' : 'none' }}
      aria-label={ariaLabel}
    >
      {hasAssignments ? (
        <ScrollArea className="w-full h-full"> 
          <div className="space-y-1 py-1">
            {assignments.map((assignment) => (
              <Card 
                key={assignment.id} 
                className="w-full bg-card border-border shadow-sm flex flex-col text-xs" // More subtle background, ensure border
              >
                <CardHeader className="p-1.5 flex-row justify-between items-start"> {/* Reduced padding */}
                  <div className="flex-grow">
                    <CardTitle className="text-xs font-semibold text-primary break-words"> {/* break-words for long titles */}
                      {assignment.paraleloDetails?.asignatura || 'Asignatura Desconocida'}
                    </CardTitle>
                    {/* NRC Description removed as requested */}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0 ml-1" // Smaller button
                    onClick={() => onRemoveAssignment(assignment.id)}
                    aria-label={`Remover ${assignment.paraleloDetails?.asignatura || 'asignación'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {/* Smaller icon */}
                  </Button>
                </CardHeader>
                <CardContent className="p-1.5 pt-0 text-xs text-left flex-grow space-y-0.5"> {/* Reduced padding & space */}
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3 flex-shrink-0" /> {/* Changed icon to User */}
                    <span className="truncate">{assignment.paraleloDetails?.professor || 'Prof. N/A'}</span>
                  </p>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                     <span className="truncate">{assignment.salaDetails?.name || 'Sala N/A'}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
            {isOver ? 'Soltar aquí' : 'Arrastre un paralelo'}
            </span>
        </div>
      )}
      
      {isActive && (
        <div className="absolute inset-0 bg-accent/30 rounded-md flex items-center justify-center pointer-events-none">
          <CheckCircle className="h-8 w-8 text-accent-foreground" />
        </div>
      )}
      {!hasAssignments && !isOver && canDrop && (
         <div className="absolute inset-0 bg-muted/10 rounded-md flex items-center justify-center pointer-events-none opacity-50">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default ScheduleGridCell;
