
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface CreateParaleloDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { baseSubject: string; section: string; professor: string | null; nrc: string }) => void;
  baseSubjects: string[];
  professors: string[];
  isLoadingData: boolean;
}

const SIN_ASIGNAR_PROF_VALUE = "_SIN_ASIGNAR_";

const CreateParaleloDialog: React.FC<CreateParaleloDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  baseSubjects,
  professors,
  isLoadingData,
}) => {
  const [selectedBaseSubject, setSelectedBaseSubject] = useState('');
  const [section, setSection] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState<string>(SIN_ASIGNAR_PROF_VALUE);
  const [nrc, setNrc] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form fields when dialog opens
      setSelectedBaseSubject('');
      setSection('');
      setSelectedProfessor(SIN_ASIGNAR_PROF_VALUE);
      setNrc('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaseSubject.trim()) {
        toast({ title: "Error de Validación", description: "Debe seleccionar una materia base.", variant: "destructive" });
        return;
    }
    if (!section.trim()) {
        toast({ title: "Error de Validación", description: "La sección es obligatoria (ej: C1, C2).", variant: "destructive" });
        return;
    }
    if (!/^[Cc]\d+$/.test(section.trim())) {
      toast({ title: "Error de Validación", description: "El formato de la sección debe ser 'C' seguido de un número (ej: C1, C2).", variant: "destructive" });
      return;
    }
    
    onSubmit({
      baseSubject: selectedBaseSubject,
      section: section.trim().toUpperCase(), // Ensure section is uppercase e.g. C1
      professor: selectedProfessor === SIN_ASIGNAR_PROF_VALUE ? null : selectedProfessor,
      nrc: nrc.trim() || 'NA',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Paralelo</DialogTitle>
          <DialogDescription>
            Complete los detalles para el nuevo paralelo. La Carrera, Semestre y Período se asignarán según los filtros activos en la página principal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="baseSubject" className="text-right">
              Materia Base
            </Label>
            <Select
              value={selectedBaseSubject}
              onValueChange={setSelectedBaseSubject}
              disabled={isLoadingData || baseSubjects.length === 0}
            >
              <SelectTrigger id="baseSubject" className="col-span-3">
                <SelectValue placeholder={isLoadingData ? "Cargando materias..." : "Seleccione materia"} />
              </SelectTrigger>
              <SelectContent>
                {baseSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="section" className="text-right">
              Sección
            </Label>
            <Input
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="col-span-3"
              placeholder="Ej: C2"
              disabled={isLoadingData}
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="professor" className="text-right">
              Profesor
            </Label>
            <Select
              value={selectedProfessor}
              onValueChange={setSelectedProfessor}
              disabled={isLoadingData}
            >
              <SelectTrigger id="professor" className="col-span-3">
                <SelectValue placeholder={isLoadingData ? "Cargando profesores..." : "Seleccione profesor"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_ASIGNAR_PROF_VALUE}>Sin Asignar</SelectItem>
                {professors.map((prof) => (
                  <SelectItem key={prof} value={prof}>
                    {prof}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nrc" className="text-right">
              NRC
            </Label>
            <Input
              id="nrc"
              value={nrc}
              onChange={(e) => setNrc(e.target.value)}
              className="col-span-3"
              placeholder="(Opcional, defecto NA)"
              disabled={isLoadingData}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoadingData}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoadingData || (!selectedBaseSubject && section === '')}>
                {isLoadingData ? "Cargando..." : "Crear Paralelo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateParaleloDialog;
