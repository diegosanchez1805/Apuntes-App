export interface TarjetaFlashcard {
  id: string;
  pregunta: string;
  respuesta: string;
  temaId?: string;
  temaNombre?: string;
  materiaNombre?: string;
  materiaColor?: string;
  dificultad?: 'facil' | 'medio' | 'dificil';
}

export interface Tema {
  id: string;
  nombre: string;
  contenido: string;
  fechaEdicion: string;
  flashcards?: TarjetaFlashcard[];
}

export interface Materia {
  id: string;
  nombre: string;
  color: string;
  temas: Tema[];
}
