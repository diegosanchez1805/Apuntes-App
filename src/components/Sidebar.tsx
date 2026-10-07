import { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  X,
  Trash2,
  GripVertical,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { Materia } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface SidebarProps {
  materias: Materia[];
  materiaSeleccionadaId: string | null;
  busqueda: string;
  onBuscar: (texto: string) => void;
  onSeleccionarMateria: (id: string) => void;
  onAgregarMateria: (nombre: string) => void;
  onEliminarMateria: (id: string) => void;
  onRenombrarMateria: (id: string, nuevoNombre: string) => void;
  onCambiarColorMateria: (id: string, color: string) => void;
  onReordenarMaterias: (idArrastrado: string, idDestino: string) => void;
}

const PALETA_RAPIDA = [
  '#4f46e5', // Índigo
  '#059669', // Esmeralda
  '#dc2626', // Rojo
  '#d97706', // Ámbar
  '#7c3aed', // Violeta
  '#0891b2', // Cian
  '#ec4899', // Rosa
  '#2563eb', // Azul
];

function obtenerIniciales(nombre: string): string {
  const limpio = nombre.trim();
  if (!limpio) return 'M';
  const palabras = limpio.split(/\s+/).filter(Boolean);
  if (palabras.length === 1) {
    return palabras[0].slice(0, 2).toUpperCase();
  }
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

function Sidebar({
  materias,
  materiaSeleccionadaId,
  busqueda,
  onBuscar,
  onSeleccionarMateria,
  onAgregarMateria,
  onEliminarMateria,
  onRenombrarMateria,
  onCambiarColorMateria,
  onReordenarMaterias,
}: SidebarProps) {
  const [colapsada, setColapsada] = useLocalStorage<boolean>('sidebar-colapsada', false);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null);
  const inputAgregarRef = useRef<HTMLInputElement>(null);

  function handleAgregar() {
    const nombre = nuevaMateria.trim();
    if (nombre === '') return;
    onAgregarMateria(nombre);
    setNuevaMateria('');
  }

  function iniciarEdicion(materia: Materia) {
    setEditandoId(materia.id);
    setNombreEditado(materia.nombre);
  }

  function confirmarEdicion() {
    const nombre = nombreEditado.trim();
    if (nombre !== '' && editandoId) onRenombrarMateria(editandoId, nombre);
    setEditandoId(null);
  }

  function handleEliminar(e: React.MouseEvent, id: string, nombre: string) {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar la materia "${nombre}" y todos sus temas asociados?`)) {
      onEliminarMateria(id);
    }
  }

  function expandirYEnfocar() {
    setColapsada(false);
    setTimeout(() => {
      inputAgregarRef.current?.focus();
    }, 150);
  }

  return (
    <aside className={`sidebar ${colapsada ? 'sidebar-colapsada' : ''}`}>
      {/* Encabezado Principal */}
      <div className="sidebar-header">
        {!colapsada ? (
          <>
            <div className="sidebar-logo">
              <div className="logo-icono">
                <BookOpen size={20} />
              </div>
              <div className="sidebar-logo-textos">
                <h1 className="sidebar-titulo">Mis Apuntes</h1>
                <span className="sidebar-subtitulo">Cuaderno de estudio</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-toggle-sidebar"
              onClick={() => setColapsada(true)}
              title="Hacer pequeña la barra de materias (Ocultar detalles)"
              aria-label="Hacer pequeña la barra de materias"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        ) : (
          <div className="sidebar-header-colapsada">
            <button
              type="button"
              className="btn-toggle-sidebar btn-toggle-expand"
              onClick={() => setColapsada(false)}
              title="Expandir barra de materias"
              aria-label="Expandir barra de materias"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}
      </div>

      {!colapsada ? (
        <>
          {/* Buscador */}
          <div className="sidebar-buscador-wrapper">
            <Search size={15} className="icono-buscador" />
            <input
              type="text"
              className="buscador"
              placeholder="Buscar materia..."
              value={busqueda}
              onChange={(e) => onBuscar(e.target.value)}
            />
            {busqueda && (
              <button
                type="button"
                className="btn-limpiar-busqueda"
                onClick={() => onBuscar('')}
                title="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Formulario para agregar nueva materia */}
          <div className="agregar-materia">
            <input
              ref={inputAgregarRef}
              type="text"
              placeholder="Nueva materia (ej. Física)"
              value={nuevaMateria}
              onChange={(e) => setNuevaMateria(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
            />
            <button
              type="button"
              onClick={handleAgregar}
              title="Agregar materia"
              disabled={!nuevaMateria.trim()}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Título de lista con contador */}
          <div className="sidebar-seccion-header">
            <span>Materias</span>
            <span className="badge-contador">{materias.length}</span>
          </div>

          {/* Lista de Materias expandida */}
          <ul className="lista-materias">
            {materias.length === 0 ? (
              <li className="sidebar-vacio">
                <Layers size={22} className="icono-vacio" />
                <span>{busqueda ? 'No hay resultados' : 'No tienes materias aún'}</span>
              </li>
            ) : (
              materias.map((materia) => {
                const esSeleccionada = materia.id === materiaSeleccionadaId;
                const esArrastrado = materia.id === arrastrandoId;

                return (
                  <li
                    key={materia.id}
                    draggable
                    onDragStart={(e) => {
                      setArrastrandoId(materia.id);
                      e.dataTransfer.setData('text/plain', materia.id);
                    }}
                    onDragEnd={() => setArrastrandoId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const idArrastrado = e.dataTransfer.getData('text/plain');
                      if (idArrastrado && idArrastrado !== materia.id) {
                        onReordenarMaterias(idArrastrado, materia.id);
                      }
                      setArrastrandoId(null);
                    }}
                    onClick={() => editandoId !== materia.id && onSeleccionarMateria(materia.id)}
                    className={`item-materia ${esSeleccionada ? 'materia-activa' : ''} ${
                      esArrastrado ? 'arrastrando' : ''
                    }`}
                    style={{
                      borderLeftColor: materia.color,
                    }}
                  >
                    <div className="materia-drag-handle" title="Arrastrar para reordenar">
                      <GripVertical size={14} />
                    </div>

                    <div className="color-picker-wrapper" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="color"
                        className="color-picker"
                        value={materia.color}
                        title={`Cambiar color de ${materia.nombre}`}
                        aria-label={`Cambiar color de ${materia.nombre}`}
                        onChange={(e) => onCambiarColorMateria(materia.id, e.target.value)}
                      />
                      <div
                        className="color-swatch-dot"
                        style={{ backgroundColor: materia.color }}
                      />
                    </div>

                    {editandoId === materia.id ? (
                      <input
                        type="text"
                        className="input-renombrar"
                        value={nombreEditado}
                        autoFocus
                        title="Editar nombre de la materia"
                        aria-label="Editar nombre de la materia"
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
                        className="nombre-materia"
                        title="Doble clic para renombrar"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          iniciarEdicion(materia);
                        }}
                      >
                        {materia.nombre}
                      </span>
                    )}

                    <span className="tema-contador-badge">
                      {materia.temas.length}
                    </span>

                    <button
                      type="button"
                      className="btn-eliminar-materia"
                      onClick={(e) => handleEliminar(e, materia.id, materia.nombre)}
                      title={`Eliminar ${materia.nombre}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Paleta rápida de muestra */}
          <div className="sidebar-paleta-rapida">
            <span className="paleta-label">Colores sugeridos</span>
            <div className="paleta-swatches">
              {PALETA_RAPIDA.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="swatch-btn"
                  style={{ backgroundColor: c }}
                  title={`Aplicar ${c} a materia seleccionada`}
                  onClick={() => {
                    if (materiaSeleccionadaId) {
                      onCambiarColorMateria(materiaSeleccionadaId, c);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ================= VISTA COMPACTA / PEQUEÑA ================= */
        <div className="sidebar-cuerpo-colapsado">
          <button
            type="button"
            className="btn-mini-agregar"
            onClick={expandirYEnfocar}
            title="Agregar nueva materia (expandir)"
          >
            <Plus size={18} />
          </button>

          <ul className="lista-materias-colapsada">
            {materias.map((materia) => {
              const esSeleccionada = materia.id === materiaSeleccionadaId;

              return (
                <li key={materia.id}>
                  <button
                    type="button"
                    className={`item-materia-mini ${esSeleccionada ? 'materia-mini-activa' : ''}`}
                    onClick={() => onSeleccionarMateria(materia.id)}
                    title={`${materia.nombre} • ${materia.temas.length} ${materia.temas.length === 1 ? 'tema' : 'temas'}`}
                    style={{
                      borderLeftColor: esSeleccionada ? materia.color : 'transparent',
                    }}
                  >
                    <div
                      className="materia-mini-avatar"
                      style={{
                        backgroundColor: esSeleccionada ? materia.color : `${materia.color}22`,
                        color: esSeleccionada ? '#ffffff' : materia.color,
                        borderColor: materia.color,
                      }}
                    >
                      {obtenerIniciales(materia.nombre)}
                    </div>
                    {materia.temas.length > 0 && (
                      <span
                        className="materia-mini-dot"
                        style={{ backgroundColor: materia.color }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="sidebar-footer-colapsada">
            <button
              type="button"
              className="btn-toggle-sidebar btn-expandir-footer"
              onClick={() => setColapsada(false)}
              title="Expandir barra de materias"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;