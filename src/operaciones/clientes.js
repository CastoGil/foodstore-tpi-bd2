/**
 * Menú y operaciones CRUD de la colección clientes.
 *
 * Implementación inicial: Ricardo.
 * Modelo y datos de ejemplo: coordinados con Maca.
 *
 * Campos acordados:
 * _id, nombre, email, telefono y activo.
 *
 * Reglas:
 * - Los nuevos clientes se crean con activo: true.
 * - Las consultas habituales muestran solamente clientes activos.
 * - El correo se normaliza y tiene un índice único.
 * - La baja lógica cambia activo a false.
 * - No se eliminan documentos ni se modifican pedidos anteriores.
 *
 * Las pruebas reales de persistencia requieren Atlas configurado.
 */

import { ObjectId } from 'mongodb';
import { obtenerBaseDeDatos } from '../config/conexion.js';
import { preguntar } from '../consola/entrada.js';

function validarNombre(nombre) {
  if (!nombre.trim()) {
    throw new Error('El nombre es obligatorio.');
  }
}

function validarEmail(email) {
  const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formato.test(email)) {
    throw new Error('Ingresa un correo electrónico válido.');
  }
}

async function pedirId() {
  const texto = await preguntar('ID del cliente: ');

  if (!/^[a-fA-F0-9]{24}$/.test(texto)) {
    throw new Error(
      'El ID debe contener 24 caracteres hexadecimales.'
    );
  }

  return new ObjectId(texto);
}

function mostrarClientes(clientes) {
  console.table(
    clientes.map((cliente) => ({
      id: cliente._id.toString(),
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono ?? '',
      activo: cliente.activo
    }))
  );
}
// CREATE: registra un cliente nuevo como activo.
async function crearCliente(coleccion) {
  const nombre = await preguntar('Nombre completo: ');
  validarNombre(nombre);

  const email = (
    await preguntar('Correo electrónico: ')
  ).toLowerCase();

  validarEmail(email);

  const telefono = await preguntar('Teléfono (opcional): ');

  const resultado = await coleccion.insertOne({
    nombre,
    email,
    telefono,
    activo: true
  });

  console.log(
    `\nCliente creado. ID: ${resultado.insertedId.toString()}`
  );
}
// READ: excluye los clientes dados de baja.
async function listarClientes(coleccion) {
  const clientes = await coleccion
    .find({ activo: true })
    .sort({ nombre: 1 })
    .toArray();

  if (clientes.length === 0) {
    console.log('\nNo hay clientes activos.');
    return;
  }

  mostrarClientes(clientes);
}
// READ por ID: también respeta la baja lógica.
async function buscarCliente(coleccion) {
  const id = await pedirId();

  const cliente = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!cliente) {
    console.log('\nNo se encontró un cliente activo con ese ID.');
    return;
  }

  mostrarClientes([cliente]);
}
// UPDATE: modifica únicamente los campos permitidos.
async function modificarCliente(coleccion) {
  const id = await pedirId();

  const cliente = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!cliente) {
    console.log('\nNo se encontró un cliente activo con ese ID.');
    return;
  }

  mostrarClientes([cliente]);

  console.log('\nPresiona Enter para conservar el valor actual.');
  console.log('En teléfono, escribe "-" para dejarlo vacío.');

  const nombre = await preguntar('Nuevo nombre: ');
  const email = (
    await preguntar('Nuevo correo: ')
  ).toLowerCase();

  const telefono = await preguntar('Nuevo teléfono: ');

  const cambios = {};

  if (nombre !== '') {
    validarNombre(nombre);
    cambios.nombre = nombre;
  }

  if (email !== '') {
    validarEmail(email);
    cambios.email = email;
  }

  if (telefono !== '') {
    cambios.telefono = telefono === '-' ? '' : telefono;
  }

  if (Object.keys(cambios).length === 0) {
    console.log('\nNo se ingresaron cambios.');
    return;
  }

  const resultado = await coleccion.updateOne(
    { _id: id, activo: true },
    { $set: cambios }
  );

  if (resultado.matchedCount === 0) {
    console.log('\nEl cliente ya no está disponible como activo.');
  } else if (resultado.modifiedCount === 0) {
    console.log('\nLos valores ingresados coinciden con los actuales.');
  } else {
    console.log('\nCliente modificado correctamente.');
  }
}
// DELETE lógico: conserva el documento y sus referencias históricas.
async function desactivarCliente(coleccion) {
  const id = await pedirId();

  const cliente = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!cliente) {
    console.log('\nNo se encontró un cliente activo con ese ID.');
    return;
  }

  mostrarClientes([cliente]);

  const confirmacion = (
    await preguntar('¿Confirmas la baja lógica? (s/n): ')
  ).toLowerCase();

  if (confirmacion !== 's') {
    console.log('\nOperación cancelada.');
    return;
  }

  const resultado = await coleccion.updateOne(
    { _id: id, activo: true },
    { $set: { activo: false } }
  );

  if (resultado.matchedCount === 0) {
    console.log('\nEl cliente ya no está disponible como activo.');
    return;
  }

  console.log(
    '\nCliente desactivado. El documento permanece en la base.'
  );
}

export async function menuClientes() {
  let volver = false;
  let coleccion;

  while (!volver) {
    console.log('\n===== CLIENTES =====');
    console.log('1. Crear cliente');
    console.log('2. Listar clientes activos');
    console.log('3. Buscar cliente activo por ID');
    console.log('4. Modificar cliente');
    console.log('5. Desactivar cliente');
    console.log('0. Volver al menú principal');

    const opcion = await preguntar('Selecciona una opción: ');

    if (opcion === '0') {
      volver = true;
      continue;
    }

    if (!['1', '2', '3', '4', '5'].includes(opcion)) {
      console.log('\nOpción inválida.');
      continue;
    }

    try {
      if (!coleccion) {
        const db = await obtenerBaseDeDatos();
        const candidata = db.collection('clientes');

        await candidata.createIndex(
          { email: 1 },
          { unique: true }
        );

        coleccion = candidata;
      }

      switch (opcion) {
        case '1':
          await crearCliente(coleccion);
          break;

        case '2':
          await listarClientes(coleccion);
          break;

        case '3':
          await buscarCliente(coleccion);
          break;

        case '4':
          await modificarCliente(coleccion);
          break;

        case '5':
          await desactivarCliente(coleccion);
          break;
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log(
          '\nHay un correo duplicado. Debe ser único, incluso entre ' +
          'clientes desactivados. Si ocurrió al iniciar, revisa ' +
          'los datos existentes antes de crear el índice.'
        );
      } else {
        console.log(`\nNo se pudo completar la operación: ${error.message}`);
      }
    }
  }
}