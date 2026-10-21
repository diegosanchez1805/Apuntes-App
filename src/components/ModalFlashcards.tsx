import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  GraduationCap,
  RotateCw,
  Shuffle,
  Trophy,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import type { Materia, Tema, TarjetaFlashcard } from '../types';
import {
  obtenerTarjetasDeTema,
  obtenerTarjetasDeMateria,
  barajarTarjetas,
} from '../utils/flashcards';

interface ModalFlashcardsProps {
  isOpen: boolean;
  onClose: () => void;
  materia?: Materia | null;
  tema?: Tema | null;
  onGuardarTarjetaManual?: (materiaId: string, temaId: string, tarjeta: TarjetaFlashcard) => void;
  onEliminarTarjetaManual?: (materiaId: string, temaId: string, tarjetaId: string) => void;
}

export default function ModalFlashcards({
  isOpen,
  onClose,
  materia,
  tema,
  onGuardarTarjetaManual,
  onEliminarTarjetaManual,
}: ModalFlashcardsProps) {
  // Ámbito de estudio: 'tema' o 'materia'
  const [alcance, setAlcance] = useState<'tema' | 'materia'>('tema');
  const [pestaña, setPestaña] = useState<'estudiar' | 'gestionar'>('estudiar');

  // Tarjetas activas en la sesión
  const [tarjetasSesion, setTarjetasSesion] = useState<TarjetaFlashcard[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [volteada, setVolteada] = useState(false);

  // Registro de resultados de la sesión actual: tarjetaId -> 'facil' | 'medio' | 'dificil'
  const [resultados, setResultados] = useState<Record<string, 'facil' | 'medio' | 'dificil'>>({});
  const [sesionFinalizada, setSesionFinalizada] = useState(false);

  // Formulario para nueva tarjeta manual
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');

  // Cargar tarjetas según el tema y materia seleccionados
  const todasLasTarjetas = useMemo(() => {
    if (!materia) return [];
    if (alcance === 'tema' && tema) {
      return obtenerTarjetasDeTema(tema, materia.nombre, materia.color);
    }
    return obtenerTarjetasDeMateria(materia);
  }, [materia, tema, alcance]);

  // Iniciar sesión cuando se abre el modal o cambia el alcance
  useEffect(() => {
    if (isOpen) {
      setTarjetasSesion(todasLasTarjetas);
      setIndiceActual(0);
      setVolteada(false);
      setResultados({});
      setSesionFinalizada(false);
    }
  }, [isOpen, todasLasTarjetas]);

  // Si no hay tema seleccionado, forzar alcance a 'materia'
  useEffect(() => {
    if (!tema && alcance === 'tema') {
      setAlcance('materia');
    }
  }, [tema, alcance]);

  const tarjetaActual = tarjetasSesion[indiceActual] || null;

  const handleVoltear = useCallback(() => {
    setVolteada((prev) => !prev);
  }, []);

  const handleCalificar = useCallback(
    (dificultad: 'facil' | 'medio' | 'dificil') => {
      if (!tarjetaActual) return;

      const nuevosResultados = {
        ...resultados,
        [tarjetaActual.id]: dificultad,
      };
      setResultados(nuevosResultados);

      // Si es la última tarjeta, finalizar sesión
      if (indiceActual >= tarjetasSesion.length - 1) {
        setSesionFinalizada(true);
      } else {
        setVolteada(false);
        setIndiceActual((prev) => prev + 1);
      }
    },
    [tarjetaActual, resultados, indiceActual, tarjetasSesion.length]
  );

  const handleAnterior = useCallback(() => {
    if (indiceActual > 0) {
      setVolteada(false);
      setIndiceActual((prev) => prev - 1);
    }
  }, [indiceActual]);

  const handleSiguiente = useCallback(() => {
    if (indiceActual < tarjetasSesion.length - 1) {
      setVolteada(false);
      setIndiceActual((prev) => prev + 1);
    } else {
      setSesionFinalizada(true);
    }
  }, [indiceActual, tarjetasSesion.length]);

  const handleBarajar = () => {
    const barajadas = barajarTarjetas(tarjetasSesion);
    setTarjetasSesion(barajadas);
    setIndiceActual(0);
    setVolteada(false);
  };

  const handleReiniciarSesion = () => {
    setTarjetasSesion(todasLasTarjetas);
    setIndiceActual(0);
    setVolteada(false);
    setResultados({});
    setSesionFinalizada(false);
  };

  const handleRepasarPendientes = () => {
    const pendientes = tarjetasSesion.filter((t) => resultados[t.id] !== 'facil');
    if (pendientes.length > 0) {
      setTarjetasSesion(pendientes);
      setIndiceActual(0);
      setVolteada(false);
      setResultados({});
      setSesionFinalizada(false);
    }
  };

  // Atajos de teclado para estudiar ágilmente
  useEffect(() => {
    if (!isOpen || pestaña !== 'estudiar' || sesionFinalizada) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleVoltear();
      } else if (volteada && (e.key === '1' || e.code === 'Numpad1')) {
        e.preventDefault();
        handleCalificar('dificil');
      } else if (volteada && (e.key === '2' || e.code === 'Numpad2')) {
        e.preventDefault();
        handleCalificar('medio');
      } else if (volteada && (e.key === '3' || e.code === 'Numpad3')) {
        e.preventDefault();
        handleCalificar('facil');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAnterior();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSiguiente();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    pestaña,
    sesionFinalizada,
    volteada,
    handleVoltear,
    handleCalificar,
    handleAnterior,
    handleSiguiente,
    onClose,
  ]);

  const handleCrearTarjetaManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPregunta.trim() || !nuevaRespuesta.trim() || !materia || !tema) return;

    const nueva: TarjetaFlashcard = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pregunta: nuevaPregunta.trim(),
      respuesta: nuevaRespuesta.trim(),
      temaId: tema.id,
      temaNombre: tema.nombre,
      materiaNombre: materia.nombre,
      materiaColor: materia.color,
    };

    if (onGuardarTarjetaManual) {
      onGuardarTarjetaManual(materia.id, tema.id, nueva);
    }

    setNuevaPregunta('');
    setNuevaRespuesta('');
  };

  if (!isOpen) return null;

  // Estadísticas de la sesión
  const totalDominadas = Object.values(resultados).filter((v) => v === 'facil').length;
  const totalMedias = Object.values(resultados).filter((v) => v === 'medio').length;
  const totalDificiles = Object.values(resultados).filter((v) => v === 'dificil').length;
  const porcentaje =
    tarjetasSesion.length > 0 ? Math.round((totalDominadas / tarjetasSesion.length) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-contenedor modal-flashcards"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <header className="modal-header header-flashcards">
          <div className="modal-titulo-wrapper">
            <GraduationCap size={22} className="icono-flashcards-header" />
            <div>
              <h3 className="titulo-flashcards">Modo Repaso • Tarjetas de Estudio</h3>
              <p className="subtitulo-flashcards">
                {materia?.nombre || 'Apuntes'} {tema && alcance === 'tema' ? `• ${tema.nombre}` : ''}
              </p>
            </div>
          </div>

          <div className="header-acciones-flashcards">
            {/* Selector de alcance: Tema vs Toda la materia */}
            {tema && (
              <div className="selector-alcance-flashcards">
                <button
                  type="button"
                  className={`btn-alcance ${alcance === 'tema' ? 'activo' : ''}`}
                  onClick={() => setAlcance('tema')}
                >
                  Este tema
                </button>
                <button
                  type="button"
                  className={`btn-alcance ${alcance === 'materia' ? 'activo' : ''}`}
                  onClick={() => setAlcance('materia')}
                >
                  Toda la materia
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn-cerrar-modal"
              onClick={onClose}
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Barra de pestañas */}
        <div className="tabs-flashcards">
          <button
            type="button"
            className={`tab-flashcard ${pestaña === 'estudiar' ? 'activo' : ''}`}
            onClick={() => setPestaña('estudiar')}
          >
            <Sparkles size={14} />
            <span>Repasar ({tarjetasSesion.length})</span>
          </button>
          {tema && (
            <button
              type="button"
              className={`tab-flashcard ${pestaña === 'gestionar' ? 'activo' : ''}`}
              onClick={() => setPestaña('gestionar')}
            >
              <Plus size={14} />
              <span>Crear / Gestionar Fichas</span>
            </button>
          )}
        </div>

        {/* CUERPO: MODO ESTUDIAR */}
        {pestaña === 'estudiar' && (
          <div className="cuerpo-flashcards">
            {tarjetasSesion.length === 0 ? (
              <div className="flashcards-vacio">
                <BookOpen size={40} className="icono-vacio-flashcards" />
                <h4>No hay tarjetas disponibles aún</h4>
                <p>
                  Puedes escribir en tus apuntes definiciones con negritas (ej.{' '}
                  <code>- **Término**: Definición</code>) o formato <code>Pregunta ::: Respuesta</code>, o
                  crear fichas personalizadas en la pestaña de <em>Crear / Gestionar Fichas</em>.
                </p>
              </div>
            ) : sesionFinalizada ? (
              /* Pantalla de Fin de Sesión */
              <div className="resumen-sesion-flashcards">
                <div className="icono-trofeo-wrapper">
                  <Trophy size={48} className="icono-trofeo" />
                </div>
                <h3>¡Sesión de Repaso Completada!</h3>
                <p className="resumen-subtitulo">
                  Has repasado <strong>{tarjetasSesion.length}</strong> tarjetas de estudio.
                </p>

                <div className="metricas-grid-flashcards">
                  <div className="metrica-card card-verde">
                    <span className="metrica-numero">{totalDominadas}</span>
                    <span className="metrica-label">¡Dominadas!</span>
                  </div>
                  <div className="metrica-card card-amarillo">
                    <span className="metrica-numero">{totalMedias}</span>
                    <span className="metrica-label">Dudosas</span>
                  </div>
                  <div className="metrica-card card-rojo">
                    <span className="metrica-numero">{totalDificiles}</span>
                    <span className="metrica-label">Por repasar</span>
                  </div>
                </div>

                <div className="barra-porcentaje-contenedor">
                  <div className="barra-porcentaje-track">
                    <div
                      className="barra-porcentaje-fill"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <span className="porcentaje-texto">{porcentaje}% de retención</span>
                </div>

                <div className="resumen-acciones">
                  {totalDificiles + totalMedias > 0 && (
                    <button
                      type="button"
                      className="btn-accion-principal"
                      onClick={handleRepasarPendientes}
                    >
                      <RotateCw size={16} />
                      <span>Repasar las pendientes ({totalDificiles + totalMedias})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-accion-secundaria"
                    onClick={handleReiniciarSesion}
                  >
                    <span>Reiniciar todo</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Vista de la Tarjeta Interactiva 3D */
              <div className="area-estudio-flashcards">
                {/* Barra superior de progreso */}
                <div className="barra-info-estudio">
                  <div className="info-contador">
                    <span className="badge-indice">
                      Tarjeta {indiceActual + 1} de {tarjetasSesion.length}
                    </span>
                    {tarjetaActual?.temaNombre && (
                      <span className="badge-tema-origen">
                        {tarjetaActual.temaNombre}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-barajar-flashcards"
                    onClick={handleBarajar}
                    title="Barajar orden aleatorio"
                  >
                    <Shuffle size={14} />
                    <span>Barajar</span>
                  </button>
                </div>

                <div className="barra-progreso-mini">
                  <div
                    className="barra-progreso-mini-fill"
                    style={{
                      width: `${((indiceActual + 1) / tarjetasSesion.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Contenedor de la Tarjeta 3D */}
                <div
                  className={`tarjeta-3d-contenedor ${volteada ? 'esta-volteada' : ''}`}
                  onClick={handleVoltear}
                >
                  <div className="tarjeta-3d-inner">
                    {/* Cara Frontal (Pregunta) */}
                    <div className="tarjeta-cara cara-frontal">
                      <div className="tarjeta-badge-tipo badge-pregunta">
                        <span>PREGUNTA</span>
                      </div>
                      <div className="tarjeta-cuerpo-texto">
                        <p className="texto-pregunta">{tarjetaActual?.pregunta}</p>
                      </div>
                      <div className="tarjeta-footer-pista">
                        <RotateCw size={13} />
                        <span>Haz clic o presiona Espacio para ver la respuesta</span>
                      </div>
                    </div>

                    {/* Cara Trasera (Respuesta) */}
                    <div className="tarjeta-cara cara-trasera">
                      <div className="tarjeta-badge-tipo badge-respuesta">
                        <span>RESPUESTA</span>
                      </div>
                      <div className="tarjeta-cuerpo-texto">
                        <p className="texto-respuesta">{tarjetaActual?.respuesta}</p>
                      </div>
                      <div className="tarjeta-footer-pista">
                        <RotateCw size={13} />
                        <span>Haz clic o presiona Espacio para volver al frente</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controles de Autoevaluación o Navegación */}
                {volteada ? (
                  <div className="controles-calificacion">
                    <button
                      type="button"
                      className="btn-calificar btn-dificil"
                      onClick={() => handleCalificar('dificil')}
                      title="Atajo: Tecla 1"
                    >
                      <span className="calificar-icono">❌</span>
                      <div className="calificar-textos">
                        <span className="calificar-titulo">Necesito repasar</span>
                        <span className="calificar-atajo">Tecla 1</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="btn-calificar btn-medio"
                      onClick={() => handleCalificar('medio')}
                      title="Atajo: Tecla 2"
                    >
                      <span className="calificar-icono">⚠️</span>
                      <div className="calificar-textos">
                        <span className="calificar-titulo">Dudoso / Regular</span>
                        <span className="calificar-atajo">Tecla 2</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="btn-calificar btn-facil"
                      onClick={() => handleCalificar('facil')}
                      title="Atajo: Tecla 3"
                    >
                      <span className="calificar-icono">✅</span>
                      <div className="calificar-textos">
                        <span className="calificar-titulo">¡Dominado!</span>
                        <span className="calificar-atajo">Tecla 3</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="controles-navegacion-tarjeta">
                    <button
                      type="button"
                      className="btn-nav-tarjeta"
                      onClick={handleAnterior}
                      disabled={indiceActual === 0}
                      title="Anterior (←)"
                    >
                      <ArrowLeft size={16} />
                      <span>Anterior</span>
                    </button>

                    <button
                      type="button"
                      className="btn-voltear-central"
                      onClick={handleVoltear}
                    >
                      <RotateCw size={15} />
                      <span>Voltear Tarjeta (Espacio)</span>
                    </button>

                    <button
                      type="button"
                      className="btn-nav-tarjeta"
                      onClick={handleSiguiente}
                      title="Siguiente (→)"
                    >
                      <span>Siguiente</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CUERPO: MODO GESTIONAR TARJETAS MANUALES */}
        {pestaña === 'gestionar' && tema && (
          <div className="cuerpo-gestionar-flashcards">
            {/* Formulario para agregar tarjeta manual */}
            <form onSubmit={handleCrearTarjetaManual} className="form-nueva-tarjeta">
              <h4>Crear Nueva Ficha para "{tema.nombre}"</h4>
              <div className="campo-form-flashcard">
                <label>Pregunta o Concepto:</label>
                <input
                  type="text"
                  placeholder="Ej. ¿Qué es un árbol AVL?"
                  value={nuevaPregunta}
                  onChange={(e) => setNuevaPregunta(e.target.value)}
                  required
                />
              </div>

              <div className="campo-form-flashcard">
                <label>Respuesta o Explicación:</label>
                <textarea
                  placeholder="Ej. Es un árbol binario de búsqueda auto-balanceable donde la diferencia de altura de los subárboles no supera 1."
                  value={nuevaRespuesta}
                  onChange={(e) => setNuevaRespuesta(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-guardar-tarjeta"
                disabled={!nuevaPregunta.trim() || !nuevaRespuesta.trim()}
              >
                <Plus size={15} />
                <span>Agregar Tarjeta</span>
              </button>
            </form>

            {/* Listado de tarjetas existentes */}
            <div className="lista-tarjetas-existentes">
              <h4>Tarjetas de este tema ({todasLasTarjetas.length})</h4>
              {todasLasTarjetas.length === 0 ? (
                <p className="texto-sin-tarjetas">No hay tarjetas registradas en este tema.</p>
              ) : (
                <div className="grid-tarjetas-guardadas">
                  {todasLasTarjetas.map((t, idx) => (
                    <div key={t.id} className="tarjeta-guardada-item">
                      <div className="tarjeta-guardada-num">#{idx + 1}</div>
                      <div className="tarjeta-guardada-contenido">
                        <p className="guardada-pregunta">
                          <strong>P:</strong> {t.pregunta}
                        </p>
                        <p className="guardada-respuesta">
                          <strong>R:</strong> {t.respuesta}
                        </p>
                      </div>
                      {t.id.startsWith('manual-') && onEliminarTarjetaManual && materia && (
                        <button
                          type="button"
                          className="btn-borrar-tarjeta-guardada"
                          onClick={() => onEliminarTarjetaManual(materia.id, tema.id, t.id)}
                          title="Eliminar tarjeta manual"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer del modal */}
        <footer className="modal-footer footer-flashcards">
          <div className="atajos-footer-flashcards">
            <span>
              <kbd>Espacio</kbd> Voltear
            </span>
            <span>•</span>
            <span>
              <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Calificar
            </span>
            <span>•</span>
            <span>
              <kbd>←</kbd> <kbd>→</kbd> Navegar
            </span>
            <span>•</span>
            <span>
              <kbd>Esc</kbd> Salir
            </span>
          </div>

          <button type="button" className="btn-secundario" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
