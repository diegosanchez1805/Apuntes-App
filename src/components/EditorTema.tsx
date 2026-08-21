import type { Tema } from '../types';

interface EditorTemaProps {
  tema: Tema;
  onCambiarContenido: (nuevoContenido: string) => void;
}

function EditorTema({ tema, onCambiarContenido }: EditorTemaProps) {
  const fecha = new Date(tema.fechaEdicion);
  const fechaFormateada = fecha.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="editor-tema">
      <div className="editor-header">
        <h3>{tema.nombre}</h3>
        <span className="fecha-edicion">Última edición: {fechaFormateada}</span>
      </div>
      <textarea
        className="textarea-apuntes"
        value={tema.contenido}
        onChange={(e) => onCambiarContenido(e.target.value)}
        placeholder="Escribe aquí tus apuntes de clase..."
      />
    </div>
  );
}

export default EditorTema;