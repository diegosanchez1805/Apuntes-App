import { useState, useRef, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Quote,
  Code,
  Minus,
  Columns2,
  Edit3,
  Eye,
  Copy,
  Check,
  Clock,
  FileText,
} from 'lucide-react';
import type { Tema } from '../types';

interface EditorTemaProps {
  tema: Tema;
  onCambiarContenido: (nuevoContenido: string) => void;
}

type ModoVista = 'split' | 'edit' | 'preview';

marked.setOptions({
  gfm: true,
  breaks: true,
});

function EditorTema({ tema, onCambiarContenido }: EditorTemaProps) {
  const [modo, setModo] = useState<ModoVista>('split');
  const [copiado, setCopiado] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fecha = new Date(tema.fechaEdicion);
  const fechaFormateada = fecha.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const { palabras, caracteres, tiempoLectura } = useMemo(() => {
    const texto = tema.contenido.trim();
    if (!texto) return { palabras: 0, caracteres: 0, tiempoLectura: 0 };
    const palabrasArr = texto.split(/\s+/).filter(Boolean);
    const numPalabras = palabrasArr.length;
    const tiempo = Math.max(1, Math.ceil(numPalabras / 200));
    return { palabras: numPalabras, caracteres: texto.length, tiempoLectura: tiempo };
  }, [tema.contenido]);

  const htmlRenderizado = useMemo(() => {
    if (!tema.contenido.trim()) {
      return '<p class="preview-vacio">Comienza a escribir apuntes para ver la vista previa con formato...</p>';
    }
    const parsed = marked.parse(tema.contenido) as string;
    return DOMPurify.sanitize(parsed);
  }, [tema.contenido]);

  const aplicarFormato = (
    prefijo: string,
    sufijo: string = '',
    marcadorPosicion: string = ''
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoActual = tema.contenido;
    const textoSeleccionado = textoActual.substring(start, end);

    let nuevoContenido = '';
    let nuevoStart = start;
    let nuevoEnd = end;

    if (textoSeleccionado.length > 0) {
      nuevoContenido =
        textoActual.substring(0, start) +
        prefijo +
        textoSeleccionado +
        sufijo +
        textoActual.substring(end);
      nuevoStart = start + prefijo.length;
      nuevoEnd = nuevoStart + textoSeleccionado.length;
    } else {
      const insercion = marcadorPosicion || 'texto';
      nuevoContenido =
        textoActual.substring(0, start) +
        prefijo +
        insercion +
        sufijo +
        textoActual.substring(end);
      nuevoStart = start + prefijo.length;
      nuevoEnd = nuevoStart + insercion.length;
    }

    onCambiarContenido(nuevoContenido);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nuevoStart, nuevoEnd);
      }
    });
  };

  const insertarTabla = () => {
    const tabla = `\n| Encabezado 1 | Encabezado 2 | Encabezado 3 |\n| :--- | :---: | ---: |\n| Fila 1, Celda 1 | Fila 1, Celda 2 | Fila 1, Celda 3 |\n| Fila 2, Celda 1 | Fila 2, Celda 2 | Fila 2, Celda 3 |\n`;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoActual = tema.contenido;

    const nuevoContenido =
      textoActual.substring(0, start) +
      (start > 0 && !textoActual.endsWith('\n', start) ? '\n' : '') +
      tabla +
      textoActual.substring(end);

    onCambiarContenido(nuevoContenido);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nuevaPosicion = start + tabla.length;
        textareaRef.current.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      aplicarFormato('**', '**', 'negrita');
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      aplicarFormato('*', '*', 'cursiva');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nuevo =
        tema.contenido.substring(0, start) + '  ' + tema.contenido.substring(end);
      onCambiarContenido(nuevo);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
            start + 2;
        }
      });
    }
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(tema.contenido);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Ignorar
    }
  };

  return (
    <div className="editor-tema-contenedor">
      <header className="editor-header-bar">
        <div className="editor-info">
          <div className="editor-titulo-wrapper">
            <FileText className="icono-titulo" size={18} />
            <h3 className="editor-titulo" title={tema.nombre}>
              {tema.nombre}
            </h3>
          </div>
          <span className="fecha-badge">
            <Clock size={12} />
            {fechaFormateada}
          </span>
        </div>

        <div className="editor-acciones-top">
          <div className="grupo-modos" role="group" aria-label="Modo de vista">
            <button
              type="button"
              className={`btn-modo ${modo === 'split' ? 'activo' : ''}`}
              onClick={() => setModo('split')}
              title="Vista Dividida (Editor y Previa)"
            >
              <Columns2 size={15} />
              <span className="texto-modo">Dividido</span>
            </button>
            <button
              type="button"
              className={`btn-modo ${modo === 'edit' ? 'activo' : ''}`}
              onClick={() => setModo('edit')}
              title="Solo Editor"
            >
              <Edit3 size={15} />
              <span className="texto-modo">Editar</span>
            </button>
            <button
              type="button"
              className={`btn-modo ${modo === 'preview' ? 'activo' : ''}`}
              onClick={() => setModo('preview')}
              title="Solo Vista Previa"
            >
              <Eye size={15} />
              <span className="texto-modo">Previa</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-accion-top"
            onClick={handleCopiar}
            title="Copiar contenido de los apuntes"
          >
            {copiado ? <Check size={14} className="icono-verde" /> : <Copy size={14} />}
            <span>{copiado ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </header>

      {modo !== 'preview' && (
        <div className="editor-toolbar">
          <div className="toolbar-seccion">
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('**', '**', 'texto en negrita')}
              title="Negrita (Ctrl+B)"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('*', '*', 'texto en cursiva')}
              title="Cursiva (Ctrl+I)"
            >
              <Italic size={15} />
            </button>
          </div>

          <div className="toolbar-separador" />

          <div className="toolbar-seccion">
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('# ', '', 'Título principal')}
              title="Encabezado H1"
            >
              <Heading1 size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('## ', '', 'Subtítulo')}
              title="Encabezado H2"
            >
              <Heading2 size={15} />
            </button>
          </div>

          <div className="toolbar-separador" />

          <div className="toolbar-seccion">
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('- ', '', 'Elemento de lista')}
              title="Lista con viñetas"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('1. ', '', 'Elemento numerado')}
              title="Lista numerada"
            >
              <ListOrdered size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('- [ ] ', '', 'Tarea pendiente')}
              title="Lista de tareas / Checklist"
            >
              <CheckSquare size={15} />
            </button>
          </div>

          <div className="toolbar-separador" />

          <div className="toolbar-seccion">
            <button
              type="button"
              className="btn-tool btn-tool-destacado"
              onClick={insertarTabla}
              title="Insertar Tabla con formato"
            >
              <TableIcon size={15} />
              <span className="tool-label">Tabla</span>
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('> ', '', 'Cita importante')}
              title="Cita en bloque"
            >
              <Quote size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('```\n', '\n```', 'código')}
              title="Bloque de código"
            >
              <Code size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormato('\n---\n', '', '')}
              title="Línea divisoria horizontal"
            >
              <Minus size={15} />
            </button>
          </div>
        </div>
      )}

      <div className={`editor-cuerpo modo-${modo}`}>
        {(modo === 'split' || modo === 'edit') && (
          <div className="panel-editor-input">
            <textarea
              ref={textareaRef}
              className="textarea-apuntes"
              value={tema.contenido}
              onChange={(e) => onCambiarContenido(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe aquí tus apuntes de clase...&#10;&#10;💡 Usa la barra de herramientas para agregar tablas, viñetas, negritas, numeraciones y citas."
              spellCheck={false}
            />
          </div>
        )}

        {(modo === 'split' || modo === 'preview') && (
          <div className="panel-preview">
            <div className="preview-encabezado-mini">
              <span>Vista previa formateada</span>
            </div>
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: htmlRenderizado }}
            />
          </div>
        )}
      </div>

      <footer className="editor-statusbar">
        <div className="stats-grupo">
          <span className="stat-item">
            <strong>{palabras}</strong> {palabras === 1 ? 'palabra' : 'palabras'}
          </span>
          <span className="stat-punto">•</span>
          <span className="stat-item">
            <strong>{caracteres}</strong> caracteres
          </span>
          {palabras > 0 && (
            <>
              <span className="stat-punto">•</span>
              <span className="stat-item">~{tiempoLectura} min de lectura</span>
            </>
          )}
        </div>
        <div className="status-ayuda">
          <span>Markdown GFM activo</span>
        </div>
      </footer>
    </div>
  );
}

export default EditorTema;