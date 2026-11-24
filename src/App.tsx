import { useState, useEffect, useMemo } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { Materia, TarjetaFlashcard } from './types';
import Sidebar from './components/Sidebar';
import PanelMateria from './components/PanelMateria';
import ModalBusquedaGlobal from './components/ModalBusquedaGlobal';
import ModalFlashcards from './components/ModalFlashcards';
import useLocalStorage from './hooks/useLocalStorage';

interface TemaReciente {
  materiaId: string;
  temaId: string;
  fechaVisita: string;
}

function formatearTiempoRelativo(fechaIso: string): string {
  try {
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'min' : 'mins'}`;
    if (diffHoras < 24 && fecha.getDate() === ahora.getDate()) {
      return `Hoy, ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const ayer = new Date(ahora);
    ayer.setDate(ahora.getDate() - 1);
    if (fecha.getDate() === ayer.getDate() && fecha.getMonth() === ayer.getMonth()) {
      return `Ayer, ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return fecha.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Reciente';
  }
}


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

### Implementación en Código (Python)
\`\`\`python
class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izq = None
        self.der = None

def in_order(nodo):
    if nodo:
        in_order(nodo.izq)
        print(f"Nodo: {nodo.valor}")
        in_order(nodo.der)
\`\`\`

### Fórmulas Matemáticas de Complejidad (LaTeX)
La altura máxima $h$ de un árbol binario balanceado de $n$ nodos cumple:

$$
h \\le \\lfloor \\log_2(n) \\rfloor + 1
$$

Y la sumatoria de nodos en un árbol binario completo de altura $h$:

$$
N(h) = \\sum_{i=0}^{h} 2^i = 2^{h+1} - 1
$$

### Diagrama de Flujo del Proceso de Inserción (Mermaid)
\`\`\`mermaid
graph TD
  A[Nuevo Valor] --> B{¿Es menor que la Raíz?}
  B -->|Sí| C[Ir al Subárbol Izquierdo]
  B -->|No| D[Ir al Subárbol Derecho]
  C --> E{¿Posición Vacía?}
  D --> F{¿Posición Vacía?}
  E -->|Sí| G[Insertar como Hijo Izquierdo]
  E -->|No| C
  F -->|Sí| H[Insertar como Hijo Derecho]
  F -->|No| D
\`\`\`

### Preguntas Clave para Examen (Tarjetas de Repaso)
- ¿Cuál es la complejidad promedio de búsqueda en un BST? ::: O(log n)
- ¿Qué garantiza que un recorrido In-Order sea ascendente? ::: Que todos los valores del subárbol izquierdo son menores y los del derecho son mayores.
- ¿Cuál es la condición para que un árbol binario sea AVL? ::: El factor de equilibrio de cada nodo debe estar entre -1, 0 o +1.

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
  const [temaSeleccionadoId, setTemaSeleccionadoId] = useState<string | null>(null);
  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);
  const [modalFlashcardsAbierto, setModalFlashcardsAbierto] = useState(false);
  const [temasRecientes, setTemasRecientes] = useLocalStorage<TemaReciente[]>(
    'apuntes-temas-recientes',
    []
  );

  // Registrar en el historial de vistos cuando se abre un tema
  useEffect(() => {
    if (materiaSeleccionadaId && temaSeleccionadoId) {
      setTemasRecientes((prev) => {
        const filtrados = (prev || []).filter(
          (item) => !(item.materiaId === materiaSeleccionadaId && item.temaId === temaSeleccionadoId)
        );
        return [
          {
            materiaId: materiaSeleccionadaId,
            temaId: temaSeleccionadoId,
            fechaVisita: new Date().toISOString(),
          },
          ...filtrados,
        ].slice(0, 8);
      });
    }
  }, [materiaSeleccionadaId, temaSeleccionadoId]);

  // Lista procesada de temas recientes válidos para el acceso rápido en el menú principal
  const temasRecientesValidos = useMemo(() => {
    const mapaTemas = new Map<string, { materia: Materia; tema: Materia['temas'][0] }>();
    materias.forEach((m) => {
      m.temas.forEach((t) => {
        mapaTemas.set(`${m.id}:${t.id}`, { materia: m, tema: t });
      });
    });

    const resultado: {
      materiaId: string;
      materiaNombre: string;
      materiaColor: string;
      temaId: string;
      temaNombre: string;
      fechaVisita: string;
    }[] = [];

    // Primero los temas registrados en el historial de visitas
    (temasRecientes || []).forEach((item) => {
      const datos = mapaTemas.get(`${item.materiaId}:${item.temaId}`);
      if (datos) {
        resultado.push({
          materiaId: datos.materia.id,
          materiaNombre: datos.materia.nombre,
          materiaColor: datos.materia.color,
          temaId: datos.tema.id,
          temaNombre: datos.tema.nombre,
          fechaVisita: item.fechaVisita,
        });
        mapaTemas.delete(`${item.materiaId}:${item.temaId}`);
      }
    });

    // Si hay menos de 4, rellenar con los temas existentes ordenados por fechaEdicion
    if (resultado.length < 4) {
      const restantes = Array.from(mapaTemas.values()).sort(
        (a, b) => new Date(b.tema.fechaEdicion).getTime() - new Date(a.tema.fechaEdicion).getTime()
      );

      for (const r of restantes) {
        if (resultado.length >= 6) break;
        resultado.push({
          materiaId: r.materia.id,
          materiaNombre: r.materia.nombre,
          materiaColor: r.materia.color,
          temaId: r.tema.id,
          temaNombre: r.tema.nombre,
          fechaVisita: r.tema.fechaEdicion,
        });
      }
    }

    return resultado.slice(0, 6);
  }, [materias, temasRecientes]);

  const [mostrarTodosRecientes, setMostrarTodosRecientes] = useState(false);

  const temasParaMostrar = useMemo(() => {
    return mostrarTodosRecientes ? temasRecientesValidos : temasRecientesValidos.slice(0, 4);
  }, [temasRecientesValidos, mostrarTodosRecientes]);

  function guardarTarjetaManual(materiaId: string, temaId: string, tarjeta: TarjetaFlashcard) {
    setMaterias((prev) =>
      prev.map((m) =>
        m.id === materiaId
          ? {
              ...m,
              temas: m.temas.map((t) =>
                t.id === temaId
                  ? {
                      ...t,
                      flashcards: [...(t.flashcards || []), tarjeta],
                    }
                  : t
              ),
            }
          : m
      )
    );
  }

  function eliminarTarjetaManual(materiaId: string, temaId: string, tarjetaId: string) {
    setMaterias((prev) =>
      prev.map((m) =>
        m.id === materiaId
          ? {
              ...m,
              temas: m.temas.map((t) =>
                t.id === temaId
                  ? {
                      ...t,
                      flashcards: (t.flashcards || []).filter((f) => f.id !== tarjetaId),
                    }
                  : t
              ),
            }
          : m
      )
    );
  }

  // Atajo global Ctrl+K para abrir la paleta de búsqueda
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setModalBusquedaAbierto((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSeleccionarResultadoBusqueda = (materiaId: string, temaId: string) => {
    setMateriaSeleccionadaId(materiaId);
    setTemaSeleccionadoId(temaId);
  };

  const handleIrAlMenuPrincipal = () => {
    setMateriaSeleccionadaId(null);
    setTemaSeleccionadoId(null);
  };

  const valorInicialOscuro =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;

  const [modoOscuro, setModoOscuro] = useLocalStorage<boolean>(
    'apuntes-modo-oscuro',
    valorInicialOscuro
  );

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [modoOscuro]);

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
        todasLasMaterias={materias}
        onRestaurarMaterias={setMaterias}
        materiaSeleccionadaId={materiaSeleccionadaId}
        busqueda={busqueda}
        onBuscar={setBusqueda}
        onSeleccionarMateria={(id) => {
          setMateriaSeleccionadaId(id);
          setTemaSeleccionadoId(null);
        }}
        onAgregarMateria={agregarMateria}
        onEliminarMateria={eliminarMateria}
        onRenombrarMateria={renombrarMateria}
        onCambiarColorMateria={cambiarColorMateria}
        onReordenarMaterias={reordenarMaterias}
        onAbrirBusquedaGlobal={() => setModalBusquedaAbierto(true)}
        onIrAlInicio={handleIrAlMenuPrincipal}
        modoOscuro={modoOscuro}
        onToggleModoOscuro={() => setModoOscuro((prev) => !prev)}
      />
      <main className="contenido">
        {materiaSeleccionada ? (
          <PanelMateria
            materia={materiaSeleccionada}
            temaSeleccionadoId={temaSeleccionadoId}
            onSeleccionarTema={setTemaSeleccionadoId}
            onAgregarTema={agregarTema}
            onActualizarContenido={actualizarContenidoTema}
            onEliminarTema={eliminarTema}
            onRenombrarTema={renombrarTema}
            onReordenarTemas={reordenarTemas}
            modoOscuro={modoOscuro}
            onToggleModoOscuro={() => setModoOscuro((prev) => !prev)}
            onAbrirFlashcards={() => setModalFlashcardsAbierto(true)}
            onIrAlMenuPrincipal={handleIrAlMenuPrincipal}
          />
        ) : (
          <div className="bienvenida-dashboard">
            <div className="bienvenida-card">
              <h2>Tus apuntes</h2>
              <p className="bienvenida-desc">
                Elige una materia a la izquierda o busca en todos tus apuntes con Ctrl + K.
              </p>

              {/* Acceso Rápido a Temas Recientes */}
              {temasRecientesValidos.length > 0 && (
                <div className="seccion-recientes-dashboard">
                  <div className="dashboard-seccion-header">
                    <h3>Seguir con</h3>
                  </div>

                  <div className="grid-temas-recientes">
                    {temasParaMostrar.map((item) => (
                      <button
                        key={`${item.materiaId}-${item.temaId}`}
                        type="button"
                        className="card-tema-reciente"
                        onClick={() => {
                          setMateriaSeleccionadaId(item.materiaId);
                          setTemaSeleccionadoId(item.temaId);
                        }}
                        title={`Abrir apunte "${item.temaNombre}" en ${item.materiaNombre}`}
                      >
                        <div className="reciente-top">
                          <span
                            className="reciente-materia-badge"
                            style={{
                              backgroundColor: `${item.materiaColor}18`,
                              color: item.materiaColor,
                              borderColor: `${item.materiaColor}38`,
                            }}
                          >
                            <span
                              className="reciente-dot"
                              style={{ backgroundColor: item.materiaColor }}
                            />
                            {item.materiaNombre}
                          </span>
                          <span className="reciente-tiempo">
                            {formatearTiempoRelativo(item.fechaVisita)}
                          </span>
                        </div>

                        <h4 className="reciente-titulo">{item.temaNombre}</h4>
                      </button>
                    ))}
                  </div>

                  {temasRecientesValidos.length > 4 && (
                    <div className="recientes-acciones-bottom">
                      <button
                        type="button"
                        className="btn-toggle-recientes"
                        onClick={() => setMostrarTodosRecientes(!mostrarTodosRecientes)}
                      >
                        <span>
                          {mostrarTodosRecientes
                            ? 'Mostrar menos'
                            : `Ver más (${temasRecientesValidos.length})`}
                        </span>
                        <ChevronDown
                          size={14}
                          style={{
                            transform: mostrarTodosRecientes ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {materias.length === 0 && (
                <div className="bienvenida-sin-materias">
                  <BookOpen size={32} />
                  <p>Escribe el nombre de tu primera materia en la barra lateral para empezar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Búsqueda Global (Ctrl + K) */}
      <ModalBusquedaGlobal
        isOpen={modalBusquedaAbierto}
        onClose={() => setModalBusquedaAbierto(false)}
        materias={materias}
        onSeleccionarResultado={handleSeleccionarResultadoBusqueda}
      />

      {/* Modal de Repaso con Tarjetas de Estudio (Flashcards) */}
      <ModalFlashcards
        isOpen={modalFlashcardsAbierto}
        onClose={() => setModalFlashcardsAbierto(false)}
        materia={materiaSeleccionada}
        tema={materiaSeleccionada?.temas.find((t) => t.id === temaSeleccionadoId) ?? null}
        onGuardarTarjetaManual={guardarTarjetaManual}
        onEliminarTarjetaManual={eliminarTarjetaManual}
      />
    </div>
  );
}

export default App;