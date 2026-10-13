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
      // Toggle off if already wrapped with prefix and suffix
      if (
        sufijo &&
        textoSeleccionado.startsWith(prefijo) &&
        textoSeleccionado.endsWith(sufijo) &&
        textoSeleccionado.length >= prefijo.length + sufijo.length
      ) {
        const desenvuelto = textoSeleccionado.substring(
          prefijo.length,
          textoSeleccionado.length - sufijo.length
        );
        nuevoContenido =
          textoActual.substring(0, start) + desenvuelto + textoActual.substring(end);
        nuevoStart = start;
        nuevoEnd = start + desenvuelto.length;
      } else {
        nuevoContenido =
          textoActual.substring(0, start) +
          prefijo +
          textoSeleccionado +
          sufijo +
          textoActual.substring(end);
        nuevoStart = start + prefijo.length;
        nuevoEnd = nuevoStart + textoSeleccionado.length;
      }
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

  /**
   * Aplica formato a nivel de línea o bloque de múltiples líneas:
   * viñetas (-), numeración (1., 2.), tareas (- [ ]), citas (>) y encabezados (#, ##).
   * Si se seleccionan múltiples líneas (ej. "messi\ncr7"), se aplica el formato a cada una.
   */
  const aplicarFormatoLineas = (
    tipo: 'bullet' | 'number' | 'checklist' | 'quote' | 'h1' | 'h2'
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textoActual = tema.contenido;

    // Localizar el inicio y fin completo de las líneas involucradas
    const lineStart = textoActual.lastIndexOf('\n', start - 1) + 1;
    const nextNewline = textoActual.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? textoActual.length : nextNewline;

    const bloqueTexto = textoActual.substring(lineStart, lineEnd);
    const lineas = bloqueTexto.split('\n');

    // Si la línea está completamente vacía
    if (bloqueTexto.trim() === '' && lineas.length === 1) {
      let insercion = '';
      let cursorOffset = 2;
      switch (tipo) {
        case 'bullet':
          insercion = '- Elemento de lista';
          cursorOffset = 2;
          break;
        case 'number':
          insercion = '1. Elemento numerado';
          cursorOffset = 3;
          break;
        case 'checklist':
          insercion = '- [ ] Tarea pendiente';
          cursorOffset = 6;
          break;
        case 'quote':
          insercion = '> Cita importante';
          cursorOffset = 2;
          break;
        case 'h1':
          insercion = '# Título principal';
          cursorOffset = 2;
          break;
        case 'h2':
          insercion = '## Subtítulo';
          cursorOffset = 3;
          break;
      }

      const nuevoContenido =
        textoActual.substring(0, lineStart) + insercion + textoActual.substring(lineEnd);
      onCambiarContenido(nuevoContenido);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            lineStart + cursorOffset,
            lineStart + insercion.length
          );
        }
      });
      return;
    }

    const regexBullet = /^(\s*)[-*+]\s+/;
    const regexNumber = /^(\s*)\d+\.\s+/;
    const regexCheck = /^(\s*)-\s\[[ xX]\]\s+/;
    const regexQuote = /^(\s*)>\s*/;
    const regexH1 = /^(\s*)#\s+/;
    const regexH2 = /^(\s*)##\s+/;

    const limpiarPrefijosLista = (linea: string) => {
      return linea
        .replace(regexCheck, '$1')
        .replace(regexBullet, '$1')
        .replace(regexNumber, '$1');
    };

    let nuevasLineas: string[] = [];

    switch (tipo) {
      case 'bullet': {
        const noVacias = lineas.filter((l) => l.trim().length > 0);
        const todasSonBullet = noVacias.length > 0 && noVacias.every((l) => regexBullet.test(l));

        if (todasSonBullet) {
          // Alternar (quitar viñetas si todas ya la tienen)
          nuevasLineas = lineas.map((l) => l.replace(regexBullet, '$1'));
        } else {
          // Agregar viñeta a todas las líneas
          nuevasLineas = lineas.map((l) => {
            if (l.trim().length === 0) return l;
            const matchIndent = l.match(/^(\s*)/);
            const indent = matchIndent ? matchIndent[1] : '';
            const limpia = limpiarPrefijosLista(l).trimStart();
            return `${indent}- ${limpia}`;
          });
        }
        break;
      }

      case 'number': {
        const noVacias = lineas.filter((l) => l.trim().length > 0);
        const todasSonNum = noVacias.length > 0 && noVacias.every((l) => regexNumber.test(l));

        if (todasSonNum) {
          nuevasLineas = lineas.map((l) => l.replace(regexNumber, '$1'));
        } else {
          let contador = 1;
          nuevasLineas = lineas.map((l) => {
            if (l.trim().length === 0) return l;
            const matchIndent = l.match(/^(\s*)/);
            const indent = matchIndent ? matchIndent[1] : '';
            const limpia = limpiarPrefijosLista(l).trimStart();
            return `${indent}${contador++}. ${limpia}`;
          });
        }
        break;
      }

      case 'checklist': {
        const noVacias = lineas.filter((l) => l.trim().length > 0);
        const todasSonCheck = noVacias.length > 0 && noVacias.every((l) => regexCheck.test(l));

        if (todasSonCheck) {
          nuevasLineas = lineas.map((l) => l.replace(regexCheck, '$1'));
        } else {
          nuevasLineas = lineas.map((l) => {
            if (l.trim().length === 0) return l;
            const matchIndent = l.match(/^(\s*)/);
            const indent = matchIndent ? matchIndent[1] : '';
            const limpia = limpiarPrefijosLista(l).trimStart();
            return `${indent}- [ ] ${limpia}`;
          });
        }
        break;
      }

      case 'quote': {
        const noVacias = lineas.filter((l) => l.trim().length > 0);
        const todasSonCita = noVacias.length > 0 && noVacias.every((l) => regexQuote.test(l));

        if (todasSonCita) {
          nuevasLineas = lineas.map((l) => l.replace(regexQuote, '$1'));
        } else {
          nuevasLineas = lineas.map((l) => {
            if (l.trim().length === 0) return l;
            const matchIndent = l.match(/^(\s*)/);
            const indent = matchIndent ? matchIndent[1] : '';
            const limpia = l.replace(regexQuote, '$1').trimStart();
            return `${indent}> ${limpia}`;
          });
        }
        break;
      }

      case 'h1': {
        const noVacias = lineas.filter((l) => l.trim().length > 0);
        const todasSonH1 = noVacias.length > 0 && noVacias.every((l) => regexH1.test(l));

        if (todasSonH1) {
          nuevasLineas = lineas.map((l) => l.replace(regexH1, '$1'));
        } else {
          nuevasLineas = lineas.map((l) => {
            if (l.trim().length === 0) return l;
            const limpia = l.replace(/^(#+)\s+/, '');
            return `# ${limpia}`;
          });
        }
        break;
      }

      case 'h2': {
        const noVacias = lineas.filter((l) => l.trim().length > 0);
        const todasSonH2 = noVacias.length > 0 && noVacias.every((l) => regexH2.test(l));

        if (todasSonH2) {
          nuevasLineas = lineas.map((l) => l.replace(regexH2, '$1'));
        } else {
          nuevasLineas = lineas.map((l) => {
            if (l.trim().length === 0) return l;
            const limpia = l.replace(/^(#+)\s+/, '');
            return `## ${limpia}`;
          });
        }
        break;
      }
    }

    const nuevoBloque = nuevasLineas.join('\n');
    const nuevoContenido =
      textoActual.substring(0, lineStart) + nuevoBloque + textoActual.substring(lineEnd);

    onCambiarContenido(nuevoContenido);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(lineStart, lineStart + nuevoBloque.length);
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
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Atajos de formato enriquecido
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      aplicarFormato('**', '**', 'negrita');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      aplicarFormato('*', '*', 'cursiva');
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const texto = tema.contenido;

    // Salto de línea inteligente con Enter (continuación automática de listas)
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const inicioLinea = texto.lastIndexOf('\n', start - 1) + 1;
      const lineaHastaCursor = texto.substring(inicioLinea, start);

      const matchCheck = lineaHastaCursor.match(/^(\s*)-\s\[[ xX]\]\s*(.*)$/);
      const matchNum = lineaHastaCursor.match(/^(\s*)(\d+)\.\s*(.*)$/);
      const matchBullet = lineaHastaCursor.match(/^(\s*)([-*+])\s*(.*)$/);
      const matchQuote = lineaHastaCursor.match(/^(\s*)>\s*(.*)$/);

      if (matchCheck) {
        e.preventDefault();
        const [, indent, resto] = matchCheck;
        if (resto.trim() === '') {
          // Elemento vacío -> salir de la lista
          const nuevo = texto.substring(0, inicioLinea) + texto.substring(start);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = inicioLinea;
            }
          });
        } else {
          // Continuar tarea
          const insercion = `\n${indent}- [ ] `;
          const nuevo = texto.substring(0, start) + insercion + texto.substring(end);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
                start + insercion.length;
            }
          });
        }
        return;
      }

      if (matchNum) {
        e.preventDefault();
        const [, indent, numStr, resto] = matchNum;
        if (resto.trim() === '') {
          // Elemento vacío -> salir de la lista numerada
          const nuevo = texto.substring(0, inicioLinea) + texto.substring(start);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = inicioLinea;
            }
          });
        } else {
          const sigNum = parseInt(numStr, 10) + 1;
          const insercion = `\n${indent}${sigNum}. `;
          const nuevo = texto.substring(0, start) + insercion + texto.substring(end);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
                start + insercion.length;
            }
          });
        }
        return;
      }

      if (matchBullet) {
        e.preventDefault();
        const [, indent, bulletChar, resto] = matchBullet;
        if (resto.trim() === '') {
          // Elemento vacío -> salir de la lista de viñetas
          const nuevo = texto.substring(0, inicioLinea) + texto.substring(start);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = inicioLinea;
            }
          });
        } else {
          // Continuar viñeta
          const insercion = `\n${indent}${bulletChar} `;
          const nuevo = texto.substring(0, start) + insercion + texto.substring(end);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
                start + insercion.length;
            }
          });
        }
        return;
      }

      if (matchQuote) {
        e.preventDefault();
        const [, indent, resto] = matchQuote;
        if (resto.trim() === '') {
          const nuevo = texto.substring(0, inicioLinea) + texto.substring(start);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = inicioLinea;
            }
          });
        } else {
          const insercion = `\n${indent}> `;
          const nuevo = texto.substring(0, start) + insercion + texto.substring(end);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
                start + insercion.length;
            }
          });
        }
        return;
      }
    }

    // Sangría y desangría con Tab / Shift+Tab
    if (e.key === 'Tab') {
      e.preventDefault();

      if (e.shiftKey) {
        // Shift+Tab: Desangrar líneas
        const lineStart = texto.lastIndexOf('\n', start - 1) + 1;
        const nextNewline = texto.indexOf('\n', end);
        const lineEnd = nextNewline === -1 ? texto.length : nextNewline;
        const bloque = texto.substring(lineStart, lineEnd);
        const lineas = bloque.split('\n');

        let espaciosEliminadosTotal = 0;
        const nuevasLineas = lineas.map((l) => {
          if (l.startsWith('  ')) {
            espaciosEliminadosTotal += 2;
            return l.substring(2);
          } else if (l.startsWith(' ')) {
            espaciosEliminadosTotal += 1;
            return l.substring(1);
          }
          return l;
        });

        const nuevoBloque = nuevasLineas.join('\n');
        const nuevo = texto.substring(0, lineStart) + nuevoBloque + texto.substring(lineEnd);
        onCambiarContenido(nuevo);

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = Math.max(
              lineStart,
              start - (lineas.length > 1 ? 0 : 2)
            );
            textareaRef.current.selectionEnd = Math.max(lineStart, end - espaciosEliminadosTotal);
          }
        });
      } else {
        // Tab: Si hay selección de varias líneas, sangrar todas
        if (start !== end && texto.substring(start, end).includes('\n')) {
          const lineStart = texto.lastIndexOf('\n', start - 1) + 1;
          const nextNewline = texto.indexOf('\n', end);
          const lineEnd = nextNewline === -1 ? texto.length : nextNewline;
          const bloque = texto.substring(lineStart, lineEnd);
          const lineas = bloque.split('\n');
          const nuevasLineas = lineas.map((l) => '  ' + l);
          const nuevoBloque = nuevasLineas.join('\n');
          const nuevo = texto.substring(0, lineStart) + nuevoBloque + texto.substring(lineEnd);
          onCambiarContenido(nuevo);

          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = start + 2;
              textareaRef.current.selectionEnd = end + lineas.length * 2;
            }
          });
        } else {
          // Tab simple: insertar 2 espacios
          const nuevo = texto.substring(0, start) + '  ' + texto.substring(end);
          onCambiarContenido(nuevo);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
            }
          });
        }
      }
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
              onClick={() => aplicarFormatoLineas('h1')}
              title="Encabezado H1 (aplica a las líneas seleccionadas)"
            >
              <Heading1 size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormatoLineas('h2')}
              title="Encabezado H2 (aplica a las líneas seleccionadas)"
            >
              <Heading2 size={15} />
            </button>
          </div>

          <div className="toolbar-separador" />

          <div className="toolbar-seccion">
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormatoLineas('bullet')}
              title="Lista con viñetas / puntos (aplica a cada línea seleccionada)"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormatoLineas('number')}
              title="Lista numerada (aplica a cada línea seleccionada)"
            >
              <ListOrdered size={15} />
            </button>
            <button
              type="button"
              className="btn-tool"
              onClick={() => aplicarFormatoLineas('checklist')}
              title="Lista de tareas / Checklist (aplica a cada línea seleccionada)"
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
              onClick={() => aplicarFormatoLineas('quote')}
              title="Cita en bloque (aplica a cada línea seleccionada)"
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