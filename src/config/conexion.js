/**
 * Conexión compartida con MongoDB Atlas.
 *
 * Ricardo implementa la conexión.
 * Maca configura Atlas, Database Access y Network Access.
 *
 * Configuración leída desde el archivo .env:
 * - MONGODB_URI: cadena de conexión.
 * - MONGODB_DB: foodstore_tpi.
 *
 * No escribir credenciales directamente en este archivo.
 * La conexión se abre cuando una operación la necesita.
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

let cliente;
let baseDeDatos;

export async function obtenerBaseDeDatos() {
  if (baseDeDatos) {
    return baseDeDatos;
  }

  const uri = process.env.MONGODB_URI?.trim();
  const nombreBase = process.env.MONGODB_DB?.trim();

  if (!uri) {
    throw new Error(
      'Falta configurar MONGODB_URI en el archivo .env.'
    );
  }

  if (!nombreBase) {
    throw new Error(
      'Falta configurar MONGODB_DB en el archivo .env.'
    );
  }

  try {
    cliente = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000
    });

    await cliente.connect();

    const db = cliente.db(nombreBase);
    await db.command({ ping: 1 });

    baseDeDatos = db;

    console.log('\nConexión con MongoDB establecida.');
    return baseDeDatos;
  } catch {
    if (cliente) {
      await cliente.close().catch(() => {});
    }

    cliente = undefined;
    baseDeDatos = undefined;

    throw new Error(
      'No se pudo conectar a MongoDB. Revisa la URI, las credenciales, ' +
      'el acceso de red de Atlas y tu conexión a Internet.'
    );
  }
}

export async function cerrarConexion() {
  if (cliente) {
    await cliente.close();
    cliente = undefined;
    baseDeDatos = undefined;
  }
}