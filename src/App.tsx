import { useState } from 'react';
import type { Materia } from './types';
import Sidebar from './components/SideBar';
import PanelMateria from './components/PanelMateria';
import useLocalStorage from './hooks/useLocalStorage';


function App() {
  const [materias, setMaterias] = useLocalStorage<Materia[]>('apuntes-materias', [
  { id: '1', nombre: 'Estructuras de Datos', color: '#4f46e5', temas: [] },
  { id: '2', nombre: 'Bases de Datos', color: '#059669', temas: [] },
]);
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState<string | null>(null);

  const materiaSeleccionada = materias.find((m) => m.id === materiaSeleccionadaId) ?? null;

  function agregarTema(materiaId: string, nombreTema: string) {
  setMaterias((prev) =>
    prev.map((materia) =>
      materia.id === materiaId
        ? {
            ...materia,
            temas: [
              ...materia.temas,
              {
                id: crypto.randomUUID(),
                nombre: nombreTema,
                contenido: '',
                fechaEdicion: new Date().toISOString(),
              },
            ],
          }
        : materia
    )
  );
}
function actualizarContenidoTema(materiaId: string, temaId: string, nuevoContenido: string) {
  setMaterias((prev) =>
    prev.map((materia) =>
      materia.id === materiaId
        ? {
            ...materia,
            temas: materia.temas.map((tema) =>
              tema.id === temaId
                ? { ...tema, contenido: nuevoContenido, fechaEdicion: new Date().toISOString() }
                : tema
            ),
          }
        : materia
    )
  );
}
const COLORES_DISPONIBLES = ['#4f46e5', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];

function agregarMateria(nombre: string) {
  const colorAleatorio = COLORES_DISPONIBLES[materias.length % COLORES_DISPONIBLES.length];
  const nuevaMateria: Materia = {
    id: crypto.randomUUID(),
    nombre,
    color: colorAleatorio,
    temas: [],
  };
  setMaterias((prev) => [...prev, nuevaMateria]);
}

function eliminarMateria(id: string) {
  setMaterias((prev) => prev.filter((materia) => materia.id !== id));
  if (materiaSeleccionadaId === id) {
    setMateriaSeleccionadaId(null);
  }
}
function eliminarTema(materiaId: string, temaId: string) {
  setMaterias((prev) =>
    prev.map((materia) =>
      materia.id === materiaId
        ? { ...materia, temas: materia.temas.filter((tema) => tema.id !== temaId) }
        : materia
    )
  );
}
function renombrarMateria(id: string, nuevoNombre: string) {
  setMaterias((prev) =>
    prev.map((m) => (m.id === id ? { ...m, nombre: nuevoNombre } : m))
  );
}

function cambiarColorMateria(id: string, color: string) {
  setMaterias((prev) => prev.map((m) => (m.id === id ? { ...m, color } : m)));
}

function renombrarTema(materiaId: string, temaId: string, nuevoNombre: string) {
  setMaterias((prev) =>
    prev.map((m) =>
      m.id === materiaId
        ? { ...m, temas: m.temas.map((t) => (t.id === temaId ? { ...t, nombre: nuevoNombre } : t)) }
        : m
    )
  );
}
function reordenarMaterias(idArrastrado: string, idDestino: string) {
  setMaterias((prev) => {
    const indiceOrigen = prev.findIndex((m) => m.id === idArrastrado);
    const indiceDestino = prev.findIndex((m) => m.id === idDestino);
    if (indiceOrigen === -1 || indiceDestino === -1) return prev;
    const copia = [...prev];
    const [movida] = copia.splice(indiceOrigen, 1);
    copia.splice(indiceDestino, 0, movida);
    return copia;
  });
}

function reordenarTemas(materiaId: string, idArrastrado: string, idDestino: string) {
  setMaterias((prev) =>
    prev.map((m) => {
      if (m.id !== materiaId) return m;
      const indiceOrigen = m.temas.findIndex((t) => t.id === idArrastrado);
      const indiceDestino = m.temas.findIndex((t) => t.id === idDestino);
      if (indiceOrigen === -1 || indiceDestino === -1) return m;
      const copia = [...m.temas];
      const [movido] = copia.splice(indiceOrigen, 1);
      copia.splice(indiceDestino, 0, movido);
      return { ...m, temas: copia };
    })
  );
}
const [busqueda, setBusqueda] = useState('');

const materiasFiltradas = materias.filter((m) =>
  m.nombre.toLowerCase().includes(busqueda.toLowerCase())
);
  return (
    <div className="app">
      <Sidebar
  materias={materiasFiltradas}
  materiaSeleccionadaId={materiaSeleccionadaId}
  busqueda={busqueda}
  onBuscar={setBusqueda}
  onSeleccionarMateria={setMateriaSeleccionadaId}
  onAgregarMateria={agregarMateria}
  onEliminarMateria={eliminarMateria}
  onRenombrarMateria={renombrarMateria}
  onCambiarColorMateria={cambiarColorMateria}
  onReordenarMaterias={reordenarMaterias}
/>
      <main className="contenido">
        {materiaSeleccionada ? (
  <PanelMateria
    materia={materiaSeleccionada}
    onAgregarTema={agregarTema}
    onActualizarContenido={actualizarContenidoTema}
    onEliminarTema={eliminarTema}
    onRenombrarTema={renombrarTema}
    onReordenarTemas={reordenarTemas}
  />
) : (
  <p>Selecciona una materia para empezar</p>
)}
      </main>
    </div>
  );
}

export default App;