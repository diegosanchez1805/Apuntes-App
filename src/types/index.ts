export interface Tema {
  id: string;
  nombre: string;
  contenido: string;
  fechaEdicion: string;
}

export interface Materia {
  id: string;
  nombre: string;
  color: string;
  temas: Tema[];
}