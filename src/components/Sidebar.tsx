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
  Sun,
  Moon,
  ShieldCheck,
  Download,
  Upload,
  Check,
  Home,
} from 'lucide-react';
import type { Materia } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { exportarTodasLasImagenes, importarImagenes } from '../utils/imageStore';

interface SidebarProps {
  materias: Materia[];
  todasLasMaterias?: Materia[];
  materiaSeleccionadaId: string | null;
  busqueda: string;
  onBuscar: (texto: string) => void;
  onSeleccionarMateria: (id: string) => void;
  onAgregarMateria: (nombre: string) => void;
  onEliminarMateria: (id: string) => void;
  onRenombrarMateria: (id: string, nuevoNombre: string) => void;
  onCambiarColorMateria: (id: string, color: string) => void;
  onReordenarMaterias: (idArrastrado: string, idDestino: string) => void;
  onRestaurarMaterias?: (nuevasMaterias: Materia[]) => void;
  onAbrirBusquedaGlobal?: () => void;
  onIrAlInicio?: () => void;
  modoOscuro: boolean;
  onToggleModoOscuro: () => void;
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
  todasLasMaterias,
  onRestaurarMaterias,
  onAbrirBusquedaGlobal,
  onIrAlInicio,
  modoOscuro,
  onToggleModoOscuro,
}: SidebarProps) {
  const [colapsada, setColapsada] = useLocalStorage<boolean>('sidebar-colapsada', false);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null);
  const [mostrarModalRespaldo, setMostrarModalRespaldo] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mensajeRespaldo, setMensajeRespaldo] = useState<string | null>(null);
  const inputAgregarRef = useRef<HTMLInputElement>(null);
  const inputArchivoRespaldoRef = useRef<HTMLInputElement>(null);

  const materiasParaRespaldo = todasLasMaterias || materias;
  const totalTemasRespaldo = materiasParaRespaldo.reduce((acc, m) => acc + m.temas.length, 0);

  const handleDescargarRespaldo = async () => {
    try {
      setExportando(true);
      const imagenes = await exportarTodasLasImagenes();
      const datosRespaldo = {
        app: 'apuntes-app',
        version: '1.0',
        fechaExportacion: new Date().toISOString(),
        materias: materiasParaRespaldo,
        imagenes,
      };

      const fechaHoy = new Date().toISOString().split('T')[0];
      const blob = new Blob([JSON.stringify(datosRespaldo, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo_apuntes_${fechaHoy}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMensajeRespaldo('¡Copia de seguridad descargada con éxito!');
      setTimeout(() => setMensajeRespaldo(null), 3000);
    } catch (err) {
      console.error('Error al exportar respaldo:', err);
      alert('Hubo un error al generar la copia de seguridad.');
    } finally {
      setExportando(false);
    }
  };

  const handleCargarArchivoRespaldo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evento) => {
      try {
        const contenido = evento.target?.result as string;
        const datos = JSON.parse(contenido);

        if (!datos || !Array.isArray(datos.materias)) {
          alert('El archivo no tiene un formato válido de respaldo de apuntes.');
          return;
        }

        const materiasImportadas = datos.materias as Materia[];
        const numTemas = materiasImportadas.reduce((acc, m) => acc + (m.temas?.length || 0), 0);

        const confirmar = window.confirm(
          `El respaldo contiene ${materiasImportadas.length} materias y ${numTemas} temas.\n\n` +
          `¿Deseas restaurar este respaldo?\n` +
          `• Aceptar: Restaurar y aplicar este respaldo.\n` +
          `• Cancelar: No realizar cambios.`
        );

        if (!confirmar) return;

        if (datos.imagenes && typeof datos.imagenes === 'object') {
          await importarImagenes(datos.imagenes);
        }

        if (onRestaurarMaterias) {
          onRestaurarMaterias(materiasImportadas);
        }

        setMensajeRespaldo('¡Respaldo restaurado con éxito!');
        setTimeout(() => {
          setMensajeRespaldo(null);
          setMostrarModalRespaldo(false);
        }, 1500);
      } catch (err) {
        console.error('Error al restaurar respaldo:', err);
        alert('No se pudo procesar el archivo. Asegúrate de que sea un archivo JSON de respaldo válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
            <div
              className={`sidebar-logo ${onIrAlInicio ? 'sidebar-logo-clickable' : ''}`}
              onClick={onIrAlInicio}
              onKeyDown={(e) => {
                if (onIrAlInicio && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onIrAlInicio();
                }
              }}
              tabIndex={onIrAlInicio ? 0 : undefined}
              role={onIrAlInicio ? 'button' : undefined}
              title={onIrAlInicio ? 'Ir al Menú Principal (Inicio)' : undefined}
            >
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
          {/* Botón rápido de Búsqueda Global (Ctrl + K) */}
          {onAbrirBusquedaGlobal && (
            <button
              type="button"
              className="btn-trigger-busqueda-global"
              onClick={onAbrirBusquedaGlobal}
              title="Buscar en todos los apuntes y contenidos (Ctrl + K)"
            >
              <Search size={14} className="icono-busqueda-trigger" />
              <span className="texto-busqueda-trigger">Buscar en todo...</span>
              <kbd className="kbd-atajo-global">Ctrl K</kbd>
            </button>
          )}

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

          {/* Toggle de Modo Oscuro / Claro y Copias de Seguridad en vista expandida */}
          <div className="sidebar-tema-seccion">
            <button
              type="button"
              className="btn-tema-toggle btn-respaldo-sidebar"
              onClick={() => setMostrarModalRespaldo(true)}
              title="Copias de Seguridad (Exportar / Importar)"
            >
              <ShieldCheck size={15} />
              <span>Copia de Seguridad</span>
            </button>
            <button
              type="button"
              className="btn-tema-toggle"
              onClick={onToggleModoOscuro}
              title={modoOscuro ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {modoOscuro ? <Sun size={15} /> : <Moon size={15} />}
              <span>{modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>
        </>
      ) : (
        /* ================= VISTA COMPACTA / PEQUEÑA ================= */
        <div className="sidebar-cuerpo-colapsado">
          {onIrAlInicio && (
            <button
              type="button"
              className={`btn-mini-menu-principal ${materiaSeleccionadaId === null ? 'activo' : ''}`}
              onClick={onIrAlInicio}
              title="Menú Principal (Inicio)"
            >
              <Home size={17} />
            </button>
          )}

          {onAbrirBusquedaGlobal && (
            <button
              type="button"
              className="btn-mini-busqueda-global"
              onClick={onAbrirBusquedaGlobal}
              title="Buscar en todos los apuntes (Ctrl + K)"
            >
              <Search size={16} />
            </button>
          )}

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
              className="btn-mini-tema-toggle"
              onClick={() => setMostrarModalRespaldo(true)}
              title="Copias de Seguridad (Exportar / Importar)"
            >
              <ShieldCheck size={17} />
            </button>
            <button
              type="button"
              className="btn-mini-tema-toggle"
              onClick={onToggleModoOscuro}
              title={modoOscuro ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {modoOscuro ? <Sun size={17} /> : <Moon size={17} />}
            </button>
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

      {/* Modal de Copia de Seguridad y Restauración */}
      {mostrarModalRespaldo && (
        <div
          className="modal-overlay"
          onClick={() => setMostrarModalRespaldo(false)}
        >
          <div
            className="modal-contenedor modal-respaldo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-titulo-wrapper">
                <ShieldCheck size={20} className="icono-respaldo-header" />
                <h3>Copia de Seguridad y Restauración</h3>
              </div>
              <button
                type="button"
                className="btn-cerrar-modal"
                onClick={() => setMostrarModalRespaldo(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-respaldo">
              <p className="descripcion-respaldo">
                Guarda una copia completa de todos tus apuntes, materias e imágenes en un archivo local <strong>.JSON</strong>, o restaura una copia anterior en cualquier momento.
              </p>

              {mensajeRespaldo && (
                <div className="alerta-respaldo-exito">
                  <Check size={16} />
                  <span>{mensajeRespaldo}</span>
                </div>
              )}

              <div className="respaldo-opciones-grid">
                {/* Exportar */}
                <div className="tarjeta-respaldo">
                  <div className="tarjeta-respaldo-icono icono-exportar">
                    <Download size={24} />
                  </div>
                  <h4>Exportar Copia de Seguridad</h4>
                  <p>
                    Descarga un archivo con tus <strong>{materiasParaRespaldo.length} materias</strong> y <strong>{totalTemasRespaldo} temas</strong> (incluyendo imágenes adjuntas).
                  </p>
                  <button
                    type="button"
                    className="btn-accion-respaldo btn-descargar-respaldo"
                    onClick={handleDescargarRespaldo}
                    disabled={exportando}
                  >
                    <Download size={16} />
                    <span>{exportando ? 'Generando archivo...' : 'Descargar Respaldo JSON'}</span>
                  </button>
                </div>

                {/* Importar / Restaurar */}
                <div className="tarjeta-respaldo">
                  <div className="tarjeta-respaldo-icono icono-importar">
                    <Upload size={24} />
                  </div>
                  <h4>Restaurar Copia</h4>
                  <p>
                    Carga un archivo de respaldo previo (<code>.json</code>) para recuperar o migrar tus apuntes.
                  </p>
                  <input
                    ref={inputArchivoRespaldoRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleCargarArchivoRespaldo}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-accion-respaldo btn-cargar-respaldo"
                    onClick={() => inputArchivoRespaldoRef.current?.click()}
                  >
                    <Upload size={16} />
                    <span>Seleccionar Archivo JSON</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setMostrarModalRespaldo(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;