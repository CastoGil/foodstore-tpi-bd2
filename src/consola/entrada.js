/**
 * Entrada de datos por consola.
 *
 * Centraliza las preguntas al usuario mediante readline/promises.
 * Se comparte entre el menú principal y los módulos de operaciones.
 *
 * Implementación inicial: Ricardo.
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const consola = createInterface({
  input: stdin,
  output: stdout
});

export async function preguntar(mensaje) {
  const respuesta = await consola.question(mensaje);
  return respuesta.trim();
}

export function cerrarConsola() {
  consola.close();
}