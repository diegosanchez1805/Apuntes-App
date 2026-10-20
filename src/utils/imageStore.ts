/**
 * Gestor de almacenamiento local para imágenes en apuntes.
 * Permite guardar imágenes en IndexedDB (sin límite de tamaño de localStorage)
 * y referenciarlas en Markdown con etiquetas cortas y limpias como `![Captura](img:abc123)`
 * en lugar de enlaces base64 gigantes que llenan cientos de líneas en el editor.
 */

const DB_NAME = 'ApuntesAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'imagenes';

// Caché en memoria para renderizado sincrónico e instantáneo (0ms de latencia al escribir)
const memoriaCache = new Map<string, string>();
let dbPromise: Promise<IDBDatabase> | null = null;

function obtenerDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Guarda una imagen y devuelve un ID corto y amigable (ej: img_m0q7z9_k8f2).
 */
export async function guardarImagen(dataUrl: string, idSugerido?: string): Promise<string> {
  const id =
    idSugerido ||
    `img_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  memoriaCache.set(id, dataUrl);

  try {
    const db = await obtenerDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(dataUrl, id);
  } catch (err) {
    console.warn('IndexedDB no disponible, usando respaldo en localStorage:', err);
    try {
      localStorage.setItem(`apuntes_img_${id}`, dataUrl);
    } catch {
      // Ignorar si se supera la cuota de localStorage
    }
  }

  return id;
}

/**
 * Obtiene el dataUrl de una imagen a partir de su ID corto.
 */
export async function obtenerImagen(id: string): Promise<string | null> {
  if (memoriaCache.has(id)) {
    return memoriaCache.get(id)!;
  }

  try {
    const db = await obtenerDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const resultado = req.result as string | undefined;
        if (resultado) {
          memoriaCache.set(id, resultado);
          resolve(resultado);
        } else {
          const backup = localStorage.getItem(`apuntes_img_${id}`);
          if (backup) {
            memoriaCache.set(id, backup);
            resolve(backup);
          } else {
            resolve(null);
          }
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    const backup = localStorage.getItem(`apuntes_img_${id}`);
    if (backup) {
      memoriaCache.set(id, backup);
      return backup;
    }
    return null;
  }
}

/**
 * Precarga en la memoria caché todas las referencias `img:ID` que existan
 * en el texto para que la vista previa no parpadee y cargue al instante.
 */
export async function precargarImagenesDeTexto(texto: string): Promise<void> {
  const regexImg = /!\[.*?\]\(img:([a-zA-Z0-9_-]+)\)/g;
  const ids: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regexImg.exec(texto)) !== null) {
    const id = match[1];
    if (!memoriaCache.has(id)) {
      ids.push(id);
    }
  }

  if (ids.length === 0) return;

  await Promise.all(ids.map((id) => obtenerImagen(id)));
}

/**
 * Resuelve sincrónicamente las referencias `img:ID` en un texto Markdown
 * sustituyéndolas por sus dataUrl reales para que `marked` las renderice.
 */
export function resolverReferenciasImagenes(texto: string): string {
  return texto.replace(/!\[(.*?)\]\(img:([a-zA-Z0-9_-]+)\)/g, (match, alt, id) => {
    const dataUrl = memoriaCache.get(id);
    if (dataUrl) {
      return `![${alt}](${dataUrl})`;
    }
    return match;
  });
}

/**
 * Detecta enlaces base64 gigantes (data:image/...) en el texto y los compacta
 * automáticamente a referencias cortas `img:ID`, guardando la imagen en la base de datos local.
 * Esto limpia notas existentes que ya tenían enlaces súper largos.
 */
export async function compactarImagenesEnTexto(
  texto: string
): Promise<{ nuevoTexto: string; modificado: boolean }> {
  const regexDataUrl = /!\[(.*?)\]\((data:image\/[^)]+)\)/g;
  let modificado = false;
  let nuevoTexto = texto;

  const tareas: { matchCompleto: string; alt: string; dataUrl: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regexDataUrl.exec(texto)) !== null) {
    tareas.push({
      matchCompleto: match[0],
      alt: match[1] || 'Imagen',
      dataUrl: match[2],
    });
  }

  if (tareas.length === 0) {
    return { nuevoTexto: texto, modificado: false };
  }

  const reemplazos = await Promise.all(
    tareas.map(async ({ matchCompleto, alt, dataUrl }) => {
      const id = await guardarImagen(dataUrl);
      return {
        buscar: matchCompleto,
        reemplazarPor: `![${alt}](img:${id})`,
      };
    })
  );

  for (const { buscar, reemplazarPor } of reemplazos) {
    nuevoTexto = nuevoTexto.split(buscar).join(reemplazarPor);
    modificado = true;
  }

  return { nuevoTexto, modificado };
}

/**
 * Exporta todas las imágenes almacenadas en IndexedDB y memoria
 * para incluirlas en la copia de seguridad.
 */
export async function exportarTodasLasImagenes(): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {};

  memoriaCache.forEach((valor, clave) => {
    resultado[clave] = valor;
  });

  try {
    const db = await obtenerDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve) => {
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          resultado[cursor.key as string] = cursor.value as string;
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Error leyendo IndexedDB para exportar imágenes:', err);
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('apuntes_img_')) {
        const id = key.replace('apuntes_img_', '');
        const val = localStorage.getItem(key);
        if (val && !resultado[id]) {
          resultado[id] = val;
        }
      }
    }
  } catch {
    // Ignorar
  }

  return resultado;
}

/**
 * Importa un conjunto de imágenes a IndexedDB y memoria al restaurar un respaldo.
 */
export async function importarImagenes(imagenes: Record<string, string>): Promise<void> {
  if (!imagenes || typeof imagenes !== 'object') return;

  const entries = Object.entries(imagenes);
  if (entries.length === 0) return;

  for (const [id, dataUrl] of entries) {
    memoriaCache.set(id, dataUrl);
  }

  try {
    const db = await obtenerDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const [id, dataUrl] of entries) {
      store.put(dataUrl, id);
    }
  } catch (err) {
    console.warn('Error guardando imágenes importadas en IndexedDB:', err);
    for (const [id, dataUrl] of entries) {
      try {
        localStorage.setItem(`apuntes_img_${id}`, dataUrl);
      } catch {
        // Ignorar
      }
    }
  }
}

