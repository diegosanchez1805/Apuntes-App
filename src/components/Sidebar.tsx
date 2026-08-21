import { useState } from 'react';
import type { Materia } from '../types';

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
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');

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
    if (window.confirm(`¿Eliminar "${nombre}" y todos sus temas?`)) onEliminarMateria(id);
  }

  return (
    <aside className="sidebar">
      <h2>Mis Materias</h2>

      <input
        type="text"
        className="buscador"
        placeholder="Buscar materia..."
        value={busqueda}
        onChange={(e) => onBuscar(e.target.value)}
      />

      <div className="agregar-materia">
        <input
          type="text"
          placeholder="Nueva materia"
          value={nuevaMateria}
          onChange={(e) => setNuevaMateria(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
        />
        <button onClick={handleAgregar}>+</button>
      </div>

      <ul>
        {materias.map((materia) => (
          <li
            key={materia.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', materia.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const idArrastrado = e.dataTransfer.getData('text/plain');
              if (idArrastrado !== materia.id) onReordenarMaterias(idArrastrado, materia.id);
            }}
            onClick={() => editandoId !== materia.id && onSeleccionarMateria(materia.id)}
            className={materia.id === materiaSeleccionadaId ? 'materia-activa' : ''}
            style={{ borderLeft: `4px solid ${materia.color}` }}
          >
            <input
  type="color"
  className="color-picker"
  value={materia.color}
  title={`Cambiar color de ${materia.nombre}`}
  aria-label={`Cambiar color de ${materia.nombre}`}
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => onCambiarColorMateria(materia.id, e.target.value)}
/>

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
  onKeyDown={(e) => e.key === 'Enter' && confirmarEdicion()}
/>
            ) : (
              <span
                className="nombre-materia"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  iniciarEdicion(materia);
                }}
              >
                {materia.nombre}
              </span>
            )}

            <button
              className="btn-eliminar-materia"
              onClick={(e) => handleEliminar(e, materia.id, materia.nombre)}
              title="Eliminar materia"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;