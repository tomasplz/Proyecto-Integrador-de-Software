
"use client";

import React, { type FC } from 'react';
import ScheduleGridCell from './ScheduleGridCell';
import type { BloqueHorario, AsignacionHorario, Paralelo, Sala } from '@/services/scheduler';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface ScheduleGridProps {
  bloquesHorario: BloqueHorario[];
  asignaciones: (AsignacionHorario & { paraleloDetails?: Paralelo; salaDetails?: Sala })[];
  onDropParalelo: (paraleloId: string, bloqueHorarioId: string, day: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  isLoading: boolean;
}

const ScheduleGrid: FC<ScheduleGridProps> = ({
  bloquesHorario,
  asignaciones,
  onDropParalelo,
  onRemoveAssignment,
  isLoading,
}) => {
  const effectiveBloques = isLoading && bloquesHorario.length === 0 
    ? Array(5).fill(null).map((_,i) => ({id: `skel-bh-${i}`, time: ''})) 
    : bloquesHorario;

  return (
    <ScrollArea className="w-full rounded-lg border shadow-lg bg-card"> {/* Removed whitespace-nowrap */}
      <div className="grid grid-cols-[minmax(80px,auto)_repeat(6,minmax(150px,1fr))] gap-px bg-border"> {/* Removed overflow-hidden */}
        {/* Header Row */}
        <div className="p-3 text-xs font-semibold text-foreground sticky left-0 bg-card z-10 shadow-sm text-center">Hora</div>
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="p-3 text-center text-xs font-semibold text-foreground bg-card/95 backdrop-blur-sm sticky top-0 z-10"> {/* Added sticky top for day headers */}
            {day}
          </div>
        ))}

        {/* Data Rows */}
        {effectiveBloques.map((bloque) => (
          <React.Fragment key={bloque.id}>
            <div className="p-3 text-xs text-foreground sticky left-0 bg-card z-10 shadow-sm flex flex-col items-center justify-center">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-6 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                (() => {
                  const parts = bloque.time.split(" (");
                  const blockLetter = parts[0];
                  const timeRange = parts.length > 1 && parts[1] ? parts[1].replace(")", "") : "";
                  return (
                    <>
                      <span className="font-semibold">{blockLetter}</span>
                      {timeRange && <span className="text-muted-foreground text-[0.7rem] font-normal leading-tight mt-0.5">{timeRange}</span>}
                    </>
                  );
                })()
              )}
            </div>
            {DAYS_OF_WEEK.map((day) => {
              if (isLoading) {
                return <Skeleton key={`${day}-${bloque.id}`} className="h-[120px] w-full rounded-md" />;
              }
              const cellAssignments = asignaciones.filter(
                (a) => a.bloqueHorarioId === bloque.id && a.day === day
              );
              return (
                <ScheduleGridCell
                  key={`${day}-${bloque.id}`}
                  bloqueHorarioId={bloque.id}
                  day={day}
                  assignments={cellAssignments}
                  onDropParalelo={onDropParalelo}
                  onRemoveAssignment={onRemoveAssignment}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ScheduleGrid;
