import { useState, useEffect } from 'react';

function useLocalStorage<T>(clave: string, valorInicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado !== null ? (JSON.parse(guardado) as T) : valorInicial;
    } catch (error) {
      console.error(`Error leyendo localStorage para "${clave}":`, error);
      return valorInicial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
      console.error(`Error guardando en localStorage para "${clave}":`, error);
    }
  }, [clave, valor]);

  return [valor, setValor] as const;
}

export default useLocalStorage;
