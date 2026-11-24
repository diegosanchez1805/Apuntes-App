import { useState } from 'react';
import {
  Plus,
  Search,
  X,
  FileText,
  Trash2,
  GripVertical,
  BookOpen,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
  GraduationCap,
  Home,
} from 'lucide-react';
import type { Materia } from '../types';
import EditorTema from './EditorTema';

interface PanelMateriaProps {
  materia: Materia;
  temaSeleccionadoId?: string | null;
  onSeleccionarTema?: (id: string | null) => void;
  onAgregarTema: (materiaId: string, nombreTema: string) => void;
  onActualizarContenido: (materiaId: string, temaId: string, nuevoContenido: string) => void;
  onEliminarTema: (materiaId: string, temaId: string) => void;
  onRenombrarTema: (materiaId: string, temaId: string, nuevoNombre: string) => void;
  onReordenarTemas: (materiaId: string, idArrastrado: string, idDestino: string) => void;
  modoOscuro?: boolean;
  onToggleModoOscuro?: () => void;
  onAbrirFlashcards?: () => void;
  onIrAlMenuPrincipal?: () => void;
}

function PanelMateria({
  materia,
  temaSeleccionadoId: propTemaSeleccionadoId,
  onSeleccionarTema: propOnSeleccionarTema,
  onAgregarTema,
  onActualizarContenido,
  onEliminarTema,
  onRenombrarTema,
  onReordenarTemas,
  modoOscuro,
  onAbrirFlashcards,
  onIrAlMenuPrincipal,
}: PanelMateriaProps) {
  const [nuevoTema, setNuevoTema] = useState('');
  const [localTemaSeleccionadoId, setLocalTemaSeleccionadoId] = useState<string | null>(null);

  const temaSeleccionadoId =
    propTemaSeleccionadoId !== undefined ? propTemaSeleccionadoId : localTemaSeleccionadoId;
  const setTemaSeleccionadoId = propOnSeleccionarTema || setLocalTemaSeleccionadoId;

  const [busquedaTema, setBusquedaTema] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null);
  const [temasColapsados, setTemasColapsados] = useState(false);

  const temaSeleccionado = materia.temas.find((t) => t.id === temaSeleccionadoId) ?? null;

  const temasFiltrados = materia.temas.filter((t) =>
    t.nombre.toLowerCase().includes(busquedaTema.toLowerCase())
  );

  function handleAgregar() {
    const nombre = nuevoTema.trim();
    if (nombre === '') return;
    onAgregarTema(materia.id, nombre);
    setNuevoTema('');
  }

  function iniciarEdicion(temaId: string, nombreActual: string) {
    setEditandoId(temaId);
    setNombreEditado(nombreActual);
  }

  function confirmarEdicion() {
    const nombre = nombreEditado.trim();
    if (nombre !== '' && editandoId) onRenombrarTema(materia.id, editandoId, nombre);
    setEditandoId(null);
  }

  return (
    <div className="panel-materia">
      {/* Banner de la Materia */}
      <header className="materia-banner">
        <div className="banner-color-tag" style={{ backgroundColor: materia.color }} />
        <div className="banner-info">
          <div className="banner-titulo-row">
            <h2 className="materia-titulo">{materia.nombre}</h2>
          </div>
          <p className="banner-subtitulo">
            {materia.temas.length === 1
              ? '1 tema registrado'
              : `${materia.temas.length} temas registrados`}
          </p>
        </div>
        <div className="banner-acciones">
          {onIrAlMenuPrincipal && (
            <button
              type="button"
              className="btn-volver-menu-principal"
              onClick={onIrAlMenuPrincipal}
              title="Volver al Menú Principal (Inicio)"
            >
              <Home size={15} />
              <span>Inicio</span>
            </button>
          )}
          {onAbrirFlashcards && (
            <button
              type="button"
              className="btn-repaso-header"
              onClick={onAbrirFlashcards}
              title="Modo Repaso con Tarjetas de Estudio (Flashcards)"
            >
              <GraduationCap size={15} />
              <span>Repasar</span>
            </button>
          )}
          <button
            type="button"
            className={`btn-toggle-temas ${temasColapsados ? 'activo' : ''}`}
            onClick={() => setTemasColapsados(!temasColapsados)}
            title={temasColapsados ? "Mostrar lista de temas" : "Ocultar lista de temas"}
            aria-label={temasColapsados ? "Mostrar lista de temas" : "Ocultar lista de temas"}
          >
            {temasColapsados ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}

          </button>
        </div>
      </header>

      <div className="layout-materia">
        {/* Columna Lateral de Temas */}
        <div className={`columna-temas ${temasColapsados ? 'columna-temas-oculta' : ''}`}>
          <div className="temas-header">
            <span className="temas-seccion-titulo">Temas de la materia</span>
          </div>

          <div className="buscador-tema-wrapper">
            <Search size={14} className="icono-buscador" />
            <input
              type="text"
              className="buscador buscador-temas"
              placeholder="Buscar tema..."
              value={busquedaTema}
              onChange={(e) => setBusquedaTema(e.target.value)}
            />
            {busquedaTema && (
              <button
                type="button"
                className="btn-limpiar-busqueda"
                onClick={() => setBusquedaTema('')}
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="agregar-tema">
            <input
              type="text"
              placeholder="Nuevo tema (ej. Recursividad)"
              value={nuevoTema}
              onChange={(e) => setNuevoTema(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
            />
            <button
              type="button"
              onClick={handleAgregar}
              disabled={!nuevoTema.trim()}
              title="Agregar tema"
            >
              <Plus size={15} />
            </button>
          </div>

          <ul className="lista-temas">
            {temasFiltrados.length === 0 ? (
              <li className="temas-vacio">
                <span>
                  {busquedaTema
                    ? 'No se encontraron temas con esa búsqueda'
                    : 'Añade tu primer tema para comenzar'}
                </span>
              </li>
            ) : (
              temasFiltrados.map((tema) => {
                const esActivo = tema.id === temaSeleccionadoId;
                const esArrastrado = tema.id === arrastrandoId;

                return (
                  <li
                    key={tema.id}
                    draggable
                    onDragStart={(e) => {
                      setArrastrandoId(tema.id);
                      e.dataTransfer.setData('text/plain', tema.id);
                    }}
                    onDragEnd={() => setArrastrandoId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const idArrastrado = e.dataTransfer.getData('text/plain');
                      if (idArrastrado && idArrastrado !== tema.id) {
                        onReordenarTemas(materia.id, idArrastrado, tema.id);
                      }
                      setArrastrandoId(null);
                    }}
                    onClick={() => editandoId !== tema.id && setTemaSeleccionadoId(tema.id)}
                    className={`item-tema ${esActivo ? 'tema-activo' : ''} ${
                      esArrastrado ? 'arrastrando' : ''
                    }`}
                  >
                    <div className="tema-drag-handle" title="Arrastrar para reordenar">
                      <GripVertical size={13} />
                    </div>

                    <FileText size={15} className="icono-tema-item" />

                    {editandoId === tema.id ? (
                      <input
                        type="text"
                        className="input-renombrar"
                        value={nombreEditado}
                        autoFocus
                        title="Editar nombre del tema"
                        aria-label="Editar nombre del tema"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNombreEditado(e.target.value)}
                        onBlur={confirmarEdicion}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmarEdicion();
                          if (e.key === 'Escape') setEditandoId(null);
                        }}
                      />
                    ) : (
                      <span
                        className="nombre-tema"
                        title="Doble clic para renombrar"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          iniciarEdicion(tema.id, tema.nombre);
                        }}
                      >
                        {tema.nombre}
                      </span>
                    )}

                    <div className="tema-acciones">
                      <button
                        type="button"
                        className="btn-renombrar-tema"
                        onClick={(e) => {
                          e.stopPropagation();
                          iniciarEdicion(tema.id, tema.nombre);
                        }}
                        title="Renombrar tema"
                      >
                        <Edit3 size={12} />
                      </button>

                      <button
                        type="button"
                        className="btn-eliminar-tema"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Eliminar el tema "${tema.nombre}" y sus apuntes?`)) {
                            onEliminarTema(materia.id, tema.id);
                            if (temaSeleccionadoId === tema.id) setTemaSeleccionadoId(null);
                          }
                        }}
                        title="Eliminar tema"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Columna Principal del Editor */}
        <div className="columna-editor">
          {temaSeleccionado ? (
            <EditorTema
              key={temaSeleccionado.id}
              tema={temaSeleccionado}
              modoOscuro={modoOscuro}
              onCambiarContenido={(nuevoContenido) =>
                onActualizarContenido(materia.id, temaSeleccionado.id, nuevoContenido)
              }
            />
          ) : (
            <div className="placeholder-editor-card">
              <div className="placeholder-icono-badge" style={{ backgroundColor: `${materia.color}15`, color: materia.color }}>
                <BookOpen size={36} />
              </div>
              <h3>Selecciona un tema</h3>
              <p>
                Abre un tema de la lista o crea uno nuevo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PanelMateria;