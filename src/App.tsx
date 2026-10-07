import { useState } from 'react';
import { BookOpen, Table, List, Bold, Sparkles, ArrowRight } from 'lucide-react';
import type { Materia } from './types';
import Sidebar from './components/Sidebar';
import PanelMateria from './components/PanelMateria';
import useLocalStorage from './hooks/useLocalStorage';


const MATERIAS_POR_DEFECTO: Materia[] = [
  {
    id: '1',
    nombre: 'Estructuras de Datos',
    color: '#4f46e5',
    temas: [
      {
        id: 't1',
        nombre: 'Árboles Binarios y Complejidad',
        fechaEdicion: new Date().toISOString(),
        contenido: `# Árboles Binarios de Búsqueda (BST)

Los árboles binarios son estructuras de datos jerárquicas fundamentales. Cada nodo contiene un valor y referencias a sus subárboles izquierdo y derecho.

---

### Tabla Comparativa de Complejidad

| Operación | Caso Promedio | Peor Caso (Desbalanceado) | Con Balanceo AVL |
| :--- | :---: | :---: | :---: |
| **Búsqueda** | \`O(log n)\` | \`O(n)\` | \`O(log n)\` |
| **Inserción** | \`O(log n)\` | \`O(n)\` | \`O(log n)\` |
| **Eliminación** | \`O(log n)\` | \`O(n)\` | \`O(log n)\` |

---

### Conceptos Clave (Viñetas)
- **Raíz**: Nodo superior del árbol que carece de nodo padre.
- **Hojas**: Nodos terminales sin hijos.
- **Altura**: Distancia máxima desde la raíz hasta cualquier hoja.
- **Factor de equilibrio**: Diferencia de altura entre subárbol izquierdo y derecho.

### Pasos para Recorrido In-Order (Numeración)
1. Recorrer recursivamente el **subárbol izquierdo**.
2. Procesar el valor del nodo **actual o raíz**.
3. Recorrer recursivamente el **subárbol derecho**.

> **Regla de oro:** En un BST, el recorrido *In-Order* siempre devuelve los elementos en orden ascendente estricto.

### Tareas de Estudio (Checklist)
- [x] Repasar inserción recursiva
- [x] Analizar rotaciones simples a la izquierda y derecha
- [ ] Implementar borrado de nodos con dos hijos
`,
      },
    ],
  },
  {
    id: '2',
    nombre: 'Bases de Datos',
    color: '#059669',
    temas: [],
  },
];

function App() {
  const [materias, setMaterias] = useLocalStorage<Materia[]>(
    'apuntes-materias',
    MATERIAS_POR_DEFECTO
  );
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
          <div className="bienvenida-dashboard">
            <div className="bienvenida-card">
              <div className="bienvenida-badge">
                <Sparkles size={16} />
                <span>Organizador de Apuntes Académicos</span>
              </div>
              <h2>¡Te damos la bienvenida a tus Apuntes!</h2>
              <p className="bienvenida-desc">
                Crea y organiza tus materias, toma notas con formato enriquecido, tablas, listas, viñetas y mantén tus apuntes sincronizados automáticamente.
              </p>

              <div className="caracteristicas-grid">
                <div className="caracteristica-card">
                  <div className="caracteristica-icono icono-tabla">
                    <Table size={20} />
                  </div>
                  <h4>Tablas Estructuradas</h4>
                  <p>Inserta tablas comparativas y de datos con alineación y formato profesional.</p>
                </div>

                <div className="caracteristica-card">
                  <div className="caracteristica-icono icono-lista">
                    <List size={20} />
                  </div>
                  <h4>Viñetas y Numeración</h4>
                  <p>Organiza tus ideas con listas con puntos, listas numeradas y checklists de tareas.</p>
                </div>

                <div className="caracteristica-card">
                  <div className="caracteristica-icono icono-formato">
                    <Bold size={20} />
                  </div>
                  <h4>Negritas y Estilos</h4>
                  <p>Resalta conceptos clave en negrita, cursiva, títulos, citas y bloques de código.</p>
                </div>
              </div>

              {materias.length > 0 ? (
                <div className="bienvenida-accion">
                  <p className="accion-label">Comienza seleccionando una materia:</p>
                  <div className="materias-chips">
                    {materias.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="chip-materia"
                        onClick={() => setMateriaSeleccionadaId(m.id)}
                        style={{ borderLeftColor: m.color }}
                      >
                        <span
                          className="chip-color-dot"
                          style={{ backgroundColor: m.color }}
                        />
                        <span>{m.nombre}</span>
                        <ArrowRight size={14} className="chip-flecha" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bienvenida-sin-materias">
                  <BookOpen size={32} />
                  <p>Agrega tu primera materia desde la barra lateral izquierda para comenzar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;