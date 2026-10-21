import type { Materia, Tema, TarjetaFlashcard } from '../types';

/**
 * Escanea el contenido Markdown de un apunte para extraer tarjetas de estudio automáticamente:
 * 1. Formato Q&A explícito: "Pregunta ::: Respuesta" (estilo Anki/Obsidian)
 * 2. Formato por prefijo: "P: ... \n R: ..." o "Pregunta: ... \n Respuesta: ..."
 * 3. Formato conceptual de definiciones: "- **Término**: Definición de más de 5 caracteres"
 */
export function extraerTarjetasDeContenido(
  contenido: string,
  temaId?: string,
  temaNombre?: string,
  materiaNombre?: string,
  materiaColor?: string
): TarjetaFlashcard[] {
  const tarjetas: TarjetaFlashcard[] = [];
  if (!contenido) return tarjetas;

  const lineas = contenido.split('\n');

  // 1. Sintaxis con ':::' (Pregunta ::: Respuesta)
  lineas.forEach((linea, idx) => {
    const trimmed = linea.trim();
    if (trimmed.includes(':::') && !trimmed.startsWith('#')) {
      const partes = trimmed.split(':::');
      if (partes.length >= 2 && partes[0].trim() && partes[1].trim()) {
        tarjetas.push({
          id: `ext-sep-${idx}-${tarjetas.length}`,
          pregunta: partes[0].replace(/^[-*+]\s+/, '').trim(),
          respuesta: partes.slice(1).join(':::').trim(),
          temaId,
          temaNombre,
          materiaNombre,
          materiaColor,
        });
      }
    }
  });

  // 2. Sintaxis P: / R: o Pregunta: / Respuesta:
  for (let i = 0; i < lineas.length; i++) {
    const l1 = lineas[i].trim();
    const matchP = l1.match(/^(?:[-*+]\s+)?(?:P|Pregunta|Q):\s*(.+)$/i);
    if (matchP) {
      const pregunta = matchP[1].trim();
      // Buscar la respuesta en las siguientes 1-3 líneas
      for (let j = i + 1; j < Math.min(lineas.length, i + 4); j++) {
        const l2 = lineas[j].trim();
        const matchR = l2.match(/^(?:[-*+]\s+)?(?:R|Respuesta|A):\s*(.+)$/i);
        if (matchR) {
          tarjetas.push({
            id: `ext-qa-${i}-${j}`,
            pregunta,
            respuesta: matchR[1].trim(),
            temaId,
            temaNombre,
            materiaNombre,
            materiaColor,
          });
          i = j;
          break;
        }
      }
    }
  }

  // 3. Sintaxis **Término**: Definición (muy común en apuntes académicos)
  lineas.forEach((linea, idx) => {
    const trimmed = linea.trim();
    const matchTermino = trimmed.match(/^(?:[-*+]\s+)?\*\*([^*]+)\*\*:\s*(.+)$/);
    if (matchTermino) {
      const termino = matchTermino[1].trim();
      const definicion = matchTermino[2].trim();
      // Filtrar términos demasiado cortos o definiciones sin sustancia
      if (termino.length >= 2 && definicion.length >= 5) {
        // Evitar duplicados si ya fue capturado en otra regla
        const yaExiste = tarjetas.some(
          (t) =>
            t.pregunta.toLowerCase().includes(termino.toLowerCase()) ||
            t.respuesta.toLowerCase().includes(definicion.toLowerCase())
        );
        if (!yaExiste) {
          tarjetas.push({
            id: `ext-term-${idx}`,
            pregunta: `¿Qué es "${termino}"?`,
            respuesta: definicion,
            temaId,
            temaNombre,
            materiaNombre,
            materiaColor,
          });
        }
      }
    }
  });

  return tarjetas;
}

/**
 * Obtiene todas las tarjetas (automáticas del contenido + manuales guardadas)
 * para un tema específico.
 */
export function obtenerTarjetasDeTema(
  tema: Tema,
  materiaNombre?: string,
  materiaColor?: string
): TarjetaFlashcard[] {
  const automaticas = extraerTarjetasDeContenido(
    tema.contenido,
    tema.id,
    tema.nombre,
    materiaNombre,
    materiaColor
  );

  const manuales = (tema.flashcards || []).map((t) => ({
    ...t,
    temaId: tema.id,
    temaNombre: tema.nombre,
    materiaNombre,
    materiaColor,
  }));

  // Combinar evitando IDs duplicados
  const mapa = new Map<string, TarjetaFlashcard>();
  manuales.forEach((t) => mapa.set(t.id, t));
  automaticas.forEach((t) => {
    if (!mapa.has(t.id)) {
      mapa.set(t.id, t);
    }
  });

  return Array.from(mapa.values());
}

/**
 * Obtiene todas las tarjetas de todos los temas de una materia.
 */
export function obtenerTarjetasDeMateria(materia: Materia): TarjetaFlashcard[] {
  const todas: TarjetaFlashcard[] = [];
  materia.temas.forEach((t) => {
    const tarjetasTema = obtenerTarjetasDeTema(t, materia.nombre, materia.color);
    todas.push(...tarjetasTema);
  });
  return todas;
}

/**
 * Baraja aleatoriamente una lista de tarjetas (algoritmo Fisher-Yates).
 */
export function barajarTarjetas(tarjetas: TarjetaFlashcard[]): TarjetaFlashcard[] {
  const copia = [...tarjetas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
