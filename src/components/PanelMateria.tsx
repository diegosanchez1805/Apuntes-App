import { useState } from 'react';
import type { Materia } from '../types';
import EditorTema from './EditorTema';

interface PanelMateriaProps {
  materia: Materia;
  onAgregarTema: (materiaId: string, nombreTema: string) => void;
  onActualizarContenido: (materiaId: string, temaId: string, nuevoContenido: string) => void;
  onEliminarTema: (materiaId: string, temaId: string) => void;
  onRenombrarTema: (materiaId: string, temaId: string, nuevoNombre: string) => void;
  onReordenarTemas: (materiaId: string, idArrastrado: string, idDestino: string) => void;
}

function PanelMateria({
  materia,
  onAgregarTema,
  onActualizarContenido,
  onEliminarTema,
  onRenombrarTema,
  onReordenarTemas,
}: PanelMateriaProps) {
  const [nuevoTema, setNuevoTema] = useState('');
  const [temaSeleccionadoId, setTemaSeleccionadoId] = useState<string | null>(null);
  const [busquedaTema, setBusquedaTema] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');

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
      <h2 style={{ color: materia.color }}>{materia.nombre}</h2>

      <div className="layout-materia">
        <div className="columna-temas">
          <input
            type="text"
            className="buscador"
            placeholder="Buscar tema..."
            value={busquedaTema}
            onChange={(e) => setBusquedaTema(e.target.value)}
          />

          <div className="agregar-tema">
            <input
              type="text"
              placeholder="Nuevo tema (ej. Recursividad)"
              value={nuevoTema}
              onChange={(e) => setNuevoTema(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
            />
            <button onClick={handleAgregar}>Agregar</button>
          </div>

          <ul className="lista-temas">
            {temasFiltrados.map((tema) => (
              <li
                key={tema.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', tema.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const idArrastrado = e.dataTransfer.getData('text/plain');
                  if (idArrastrado !== tema.id) onReordenarTemas(materia.id, idArrastrado, tema.id);
                }}
                onClick={() => editandoId !== tema.id && setTemaSeleccionadoId(tema.id)}
                className={tema.id === temaSeleccionadoId ? 'tema-activo' : ''}
              >
                {editandoId === tema.id ? (
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
  onKeyDown={(e) => e.key === 'Enter' && confirmarEdicion()}
/>
                ) : (
                  <span
                    className="nombre-tema"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      iniciarEdicion(tema.id, tema.nombre);
                    }}
                  >
                    {tema.nombre}
                  </span>
                )}

                <button
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
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="columna-editor">
          {temaSeleccionado ? (
            <EditorTema
              tema={temaSeleccionado}
              onCambiarContenido={(nuevoContenido) =>
                onActualizarContenido(materia.id, temaSeleccionado.id, nuevoContenido)
              }
            />
          ) : (
            <p className="placeholder-editor">Selecciona un tema para ver o escribir tus apuntes</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PanelMateria;