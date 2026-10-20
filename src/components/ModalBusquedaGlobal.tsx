import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, CornerDownLeft, Clock } from 'lucide-react';
import type { Materia, Tema } from '../types';

interface ResultadoBusqueda {
  materiaId: string;
  materiaNombre: string;
  materiaColor: string;
  tema: Tema;
  coincidenciaEn: 'titulo' | 'contenido' | 'materia';
  snippet?: { antes: string; coincidencia: string; despues: string };
}

interface ModalBusquedaGlobalProps {
  isOpen: boolean;
  onClose: () => void;
  materias: Materia[];
  onSeleccionarResultado: (materiaId: string, temaId: string) => void;
}

function generarSnippet(
  contenido: string,
  busqueda: string
): { antes: string; coincidencia: string; despues: string } | null {
  if (!busqueda.trim()) return null;

  // Limpiar caracteres Markdown sintácticos para un texto limpio
  const textoPlano = contenido
    .replace(/[#*`_~[\]()|>-]/g, ' ')
    .replace(/\s+/g, ' ');

  const index = textoPlano.toLowerCase().indexOf(busqueda.toLowerCase());
  if (index === -1) return null;

  const inicio = Math.max(0, index - 30);
  const fin = Math.min(textoPlano.length, index + busqueda.length + 50);

  const antes = (inicio > 0 ? '… ' : '') + textoPlano.substring(inicio, index);
  const coincidencia = textoPlano.substring(index, index + busqueda.length);
  const despues =
    textoPlano.substring(index + busqueda.length, fin) + (fin < textoPlano.length ? ' …' : '');

  return { antes, coincidencia, despues };
}

function formatearFechaRelativa(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    const ahora = new Date();
    const difMs = ahora.getTime() - fecha.getTime();
    const difMin = Math.floor(difMs / 60000);
    const difHoras = Math.floor(difMin / 60);
    const difDias = Math.floor(difHoras / 24);

    if (difMin < 2) return 'Justo ahora';
    if (difMin < 60) return `Hace ${difMin} min`;
    if (difHoras < 24) return `Hace ${difHoras} h`;
    if (difDias === 1) return 'Ayer';
    if (difDias < 7) return `Hace ${difDias} d`;
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function ModalBusquedaGlobal({
  isOpen,
  onClose,
  materias,
  onSeleccionarResultado,
}: ModalBusquedaGlobalProps) {
  const [consulta, setConsulta] = useState('');
  const [indiceActivo, setIndiceActivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen) {
      setConsulta('');
      setIndiceActivo(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Lista de resultados filtrados
  const resultados: ResultadoBusqueda[] = useMemo(() => {
    const q = consulta.trim().toLowerCase();

    // Si la búsqueda está vacía, mostramos los temas más recientes (hasta 6)
    if (!q) {
      const todosLosTemas: ResultadoBusqueda[] = [];
      materias.forEach((m) => {
        m.temas.forEach((t) => {
          todosLosTemas.push({
            materiaId: m.id,
            materiaNombre: m.nombre,
            materiaColor: m.color,
            tema: t,
            coincidenciaEn: 'titulo',
          });
        });
      });

      // Ordenar por fecha de edición más reciente
      return todosLosTemas
        .sort(
          (a, b) =>
            new Date(b.tema.fechaEdicion).getTime() - new Date(a.tema.fechaEdicion).getTime()
        )
        .slice(0, 6);
    }

    const matches: ResultadoBusqueda[] = [];

    materias.forEach((m) => {
      const matchMateria = m.nombre.toLowerCase().includes(q);

      m.temas.forEach((t) => {
        const matchTitulo = t.nombre.toLowerCase().includes(q);
        const snippet = generarSnippet(t.contenido, q);
        const matchContenido = snippet !== null;

        if (matchTitulo || matchContenido || matchMateria) {
          matches.push({
            materiaId: m.id,
            materiaNombre: m.nombre,
            materiaColor: m.color,
            tema: t,
            coincidenciaEn: matchTitulo ? 'titulo' : matchContenido ? 'contenido' : 'materia',
            snippet: snippet || undefined,
          });
        }
      });
    });

    return matches;
  }, [materias, consulta]);

  // Ajustar índice activo si cambia la cantidad de resultados
  useEffect(() => {
    setIndiceActivo((prev) => (prev >= resultados.length ? 0 : prev));
  }, [resultados.length]);

  // Asegurar que el elemento activo se scrollea a la vista
  useEffect(() => {
    if (itemRefs.current[indiceActivo]) {
      itemRefs.current[indiceActivo]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [indiceActivo]);

  // Manejo de teclado (Flechas, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceActivo((prev) => (prev + 1) % Math.max(1, resultados.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceActivo((prev) => (prev - 1 + resultados.length) % Math.max(1, resultados.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultados[indiceActivo]) {
        abrirResultado(resultados[indiceActivo]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const abrirResultado = (res: ResultadoBusqueda) => {
    onSeleccionarResultado(res.materiaId, res.tema.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="busqueda-global-overlay" onClick={onClose}>
      <div
        className="busqueda-global-contenedor"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Cabecera / Input de búsqueda */}
        <div className="busqueda-global-header">
          <Search size={20} className="icono-busqueda-input" />
          <input
            ref={inputRef}
            type="text"
            className="input-busqueda-global"
            placeholder="Buscar conceptos, fórmulas o temas en todos tus apuntes... (ej. recursividad, O(log n))"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
          />
          {consulta ? (
            <button
              type="button"
              className="btn-limpiar-busqueda-global"
              onClick={() => {
                setConsulta('');
                inputRef.current?.focus();
              }}
              title="Borrar búsqueda"
            >
              <X size={16} />
            </button>
          ) : (
            <span className="badge-tecla-esc">ESC</span>
          )}
        </div>

        {/* Lista de resultados o estados */}
        <div className="busqueda-global-cuerpo">
          {resultados.length === 0 ? (
            <div className="busqueda-global-vacio">
              <Search size={36} className="icono-vacio" />
              <p className="vacio-titulo">No se encontraron apuntes</p>
              <p className="vacio-desc">
                No hay coincidencias para <strong>"{consulta}"</strong>. Prueba con otro término, palabra clave o concepto.
              </p>
            </div>
          ) : (
            <>
              <div className="busqueda-seccion-titulo">
                {consulta.trim() ? (
                  <span>
                    {resultados.length} {resultados.length === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}
                  </span>
                ) : (
                  <span>Apuntes recientes</span>
                )}
              </div>

              <div className="busqueda-lista-items">
                {resultados.map((res, idx) => {
                  const esActivo = idx === indiceActivo;

                  return (
                    <div
                      key={`${res.materiaId}-${res.tema.id}`}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      className={`busqueda-item ${esActivo ? 'item-activo' : ''}`}
                      onClick={() => abrirResultado(res)}
                      onMouseEnter={() => setIndiceActivo(idx)}
                    >
                      <div className="item-lado-izq">
                        <div
                          className="item-materia-badge"
                          style={{
                            backgroundColor: `${res.materiaColor}18`,
                            color: res.materiaColor,
                            borderColor: `${res.materiaColor}44`,
                          }}
                        >
                          <span
                            className="badge-dot"
                            style={{ backgroundColor: res.materiaColor }}
                          />
                          <span className="badge-materia-nombre">{res.materiaNombre}</span>
                        </div>

                        <div className="item-titulo-fila">
                          <FileText size={15} className="icono-tema-archivo" />
                          <span className="item-tema-nombre">{res.tema.nombre}</span>
                        </div>

                        {res.snippet ? (
                          <p className="item-snippet">
                            {res.snippet.antes}
                            <mark className="resaltado-busqueda">{res.snippet.coincidencia}</mark>
                            {res.snippet.despues}
                          </p>
                        ) : res.tema.contenido.trim() ? (
                          <p className="item-snippet snippet-prev">
                            {res.tema.contenido.replace(/[#*`_~[\]()|>-]/g, ' ').slice(0, 90)}…
                          </p>
                        ) : (
                          <p className="item-snippet snippet-vacio">Apunte sin contenido aún</p>
                        )}
                      </div>

                      <div className="item-lado-der">
                        <span className="item-fecha" title={new Date(res.tema.fechaEdicion).toLocaleString()}>
                          <Clock size={11} />
                          {formatearFechaRelativa(res.tema.fechaEdicion)}
                        </span>
                        {esActivo && (
                          <span className="badge-enter-accion">
                            <span>Abrir</span>
                            <CornerDownLeft size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer con atajos de navegación */}
        <div className="busqueda-global-footer">
          <div className="footer-atajo">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>Navegar</span>
          </div>
          <div className="footer-separador">•</div>
          <div className="footer-atajo">
            <kbd>↵</kbd>
            <span>Abrir apunte</span>
          </div>
          <div className="footer-separador">•</div>
          <div className="footer-atajo">
            <kbd>ESC</kbd>
            <span>Cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
