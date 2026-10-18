/**
 * Menú y operaciones CRUD de la colección productos.
 *
 * Implementación inicial: Ricardo.
 * Modelo y datos de ejemplo: coordinados con Maca.
 *
 * Campos acordados:
 * _id, nombre, categoria, precio y activo.
 *
 * Reglas:
 * - Categorías: comidas, bebidas o postres.
 * - Precio positivo en pesos argentinos, con hasta dos decimales.
 * - Los precios se almacenan como Decimal128.
 * - Las consultas habituales muestran solamente productos activos.
 * - La baja lógica no modifica los pedidos anteriores.
 */

import { ObjectId, Decimal128 } from 'mongodb';
import Decimal from 'decimal.js';
import { obtenerBaseDeDatos } from '../config/conexion.js';
import { preguntar } from '../consola/entrada.js';

const CATEGORIAS = ['comidas', 'bebidas', 'postres'];

function validarNombre(nombre) {
  if (!nombre.trim()) {
    throw new Error('El nombre es obligatorio.');
  }
}

function validarCategoria(categoria) {
  if (!CATEGORIAS.includes(categoria)) {
    throw new Error(
      'La categoría debe ser comidas, bebidas o postres.'
    );
  }
}

function convertirPrecio(texto) {
  // Acepta punto o coma decimal, sin separadores de miles.
  const normalizado = texto.trim().replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) {
    throw new Error(
      'Ingresa un precio positivo con hasta dos decimales, ' +
      'sin separadores de miles. Ejemplo: 1500.50.'
    );
  }

  const precio = new Decimal(normalizado);

  if (!precio.isFinite() || !precio.greaterThan(0)) {
    throw new Error('El precio debe ser mayor que cero.');
  }

  try {
    // La conversión usa texto para evitar errores de Number.
    return Decimal128.fromString(precio.toFixed(2));
  } catch {
    throw new Error(
      'El precio ingresado excede la capacidad de Decimal128.'
    );
  }
}

async function pedirId() {
  const texto = await preguntar('ID del producto: ');

  if (!/^[a-fA-F0-9]{24}$/.test(texto)) {
    throw new Error(
      'El ID debe contener 24 caracteres hexadecimales.'
    );
  }

  return new ObjectId(texto);
}

function mostrarProductos(productos) {
  console.table(
    productos.map((producto) => ({
      id: producto._id.toString(),
      nombre: producto.nombre,
      categoria: producto.categoria,
      precioARS: new Decimal(
        producto.precio.toString()
      ).toFixed(2),
      activo: producto.activo
    }))
  );
}

// CREATE: registra un producto nuevo como activo.
async function crearProducto(coleccion) {
  const nombre = await preguntar('Nombre del producto: ');
  validarNombre(nombre);

  console.log('Categorías disponibles: comidas, bebidas, postres.');

  const categoria = (
    await preguntar('Categoría: ')
  ).toLowerCase();

  validarCategoria(categoria);

  const textoPrecio = await preguntar(
    'Precio en ARS, sin separadores de miles: '
  );

  const precio = convertirPrecio(textoPrecio);

  const resultado = await coleccion.insertOne({
    nombre,
    categoria,
    precio,
    activo: true
  });

  console.log(
    `\nProducto creado. ID: ${resultado.insertedId.toString()}`
  );
}

// READ: excluye los productos dados de baja.
async function listarProductos(coleccion) {
  const productos = await coleccion
    .find({ activo: true })
    .sort({ nombre: 1 })
    .toArray();

  if (productos.length === 0) {
    console.log('\nNo hay productos activos.');
    return;
  }

  mostrarProductos(productos);
}

// READ por ID: también respeta la baja lógica.
async function buscarProducto(coleccion) {
  const id = await pedirId();

  const producto = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!producto) {
    console.log('\nNo se encontró un producto activo con ese ID.');
    return;
  }

  mostrarProductos([producto]);
}

// UPDATE: modifica el catálogo, sin alterar pedidos anteriores.
async function modificarProducto(coleccion) {
  const id = await pedirId();

  const producto = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!producto) {
    console.log('\nNo se encontró un producto activo con ese ID.');
    return;
  }

  mostrarProductos([producto]);

  console.log('\nPresiona Enter para conservar el valor actual.');

  const nombre = await preguntar('Nuevo nombre: ');

  const categoria = (
    await preguntar(
      'Nueva categoría (comidas, bebidas o postres): '
    )
  ).toLowerCase();

  const textoPrecio = await preguntar(
    'Nuevo precio en ARS: '
  );

  const cambios = {};

  if (nombre !== '') {
    validarNombre(nombre);
    cambios.nombre = nombre;
  }

  if (categoria !== '') {
    validarCategoria(categoria);
    cambios.categoria = categoria;
  }

  if (textoPrecio !== '') {
    cambios.precio = convertirPrecio(textoPrecio);
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
    console.log('\nEl producto ya no está disponible como activo.');
  } else if (resultado.modifiedCount === 0) {
    console.log('\nLos valores ingresados coinciden con los actuales.');
  } else {
    console.log('\nProducto modificado correctamente.');
  }
}

// DELETE lógico: conserva el documento y el historial de pedidos.
async function desactivarProducto(coleccion) {
  const id = await pedirId();

  const producto = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!producto) {
    console.log('\nNo se encontró un producto activo con ese ID.');
    return;
  }

  mostrarProductos([producto]);

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
    console.log('\nEl producto ya no está disponible como activo.');
    return;
  }

  console.log(
    '\nProducto desactivado. El documento permanece en la base.'
  );
}

export async function menuProductos() {
  let volver = false;

  while (!volver) {
    console.log('\n===== PRODUCTOS =====');
    console.log('1. Crear producto');
    console.log('2. Listar productos activos');
    console.log('3. Buscar producto activo por ID');
    console.log('4. Modificar producto');
    console.log('5. Desactivar producto');
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
      const db = await obtenerBaseDeDatos();
      const coleccion = db.collection('productos');

      switch (opcion) {
        case '1':
          await crearProducto(coleccion);
          break;

        case '2':
          await listarProductos(coleccion);
          break;

        case '3':
          await buscarProducto(coleccion);
          break;

        case '4':
          await modificarProducto(coleccion);
          break;

        case '5':
          await desactivarProducto(coleccion);
          break;
      }
    } catch (error) {
      console.log(
        `\nNo se pudo completar la operación: ${error.message}`
      );
    }
  }
}