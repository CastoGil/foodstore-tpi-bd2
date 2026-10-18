/**
 * Menú y operaciones CRUD de la colección pedidos.
 *
 * Implementación inicial: Ricardo.
 * Modelo y datos de ejemplo: coordinados con Maca.
 *
 * Linking:
 * - clienteId referencia a clientes.
 * - items.productoId referencia a productos.
 *
 * Embedding:
 * - items contiene el detalle de la compra.
 * - El nombre y precio se conservan como datos históricos.
 *
 * Reglas:
 * - Cliente y productos deben estar activos al registrar el pedido.
 * - Las cantidades son enteros positivos almacenados como Int32.
 * - Los importes se calculan con decimal.js y se guardan como Decimal128.
 * - El estado pasa de pendiente a entregado o cancelado.
 * - La baja lógica cambia activo a false sin borrar el documento.
 */

import { ObjectId, Decimal128, Int32 } from 'mongodb';
import Decimal from 'decimal.js';
import { obtenerBaseDeDatos } from '../config/conexion.js';
import { preguntar } from '../consola/entrada.js';

// Precisión suficiente para operar con importes Decimal128.
// La conversión final rechazará valores no representables.
const Dinero = Decimal.clone({ precision: 50 });

async function pedirId(mensaje) {
  const texto = await preguntar(mensaje);

  if (!/^[a-fA-F0-9]{24}$/.test(texto)) {
    throw new Error(
      'El ID debe contener 24 caracteres hexadecimales.'
    );
  }

  return new ObjectId(texto);
}

function validarCantidad(texto) {
  if (!/^\d+$/.test(texto)) {
    throw new Error('La cantidad debe ser un número entero positivo.');
  }

  const cantidad = Number(texto);

  if (
    !Number.isSafeInteger(cantidad) ||
    cantidad < 1 ||
    cantidad > 2147483647
  ) {
    throw new Error(
      'La cantidad debe estar entre 1 y 2147483647.'
    );
  }

  return cantidad;
}

function convertirImporte(valor) {
  try {
    return Decimal128.fromString(valor.toFixed(2));
  } catch {
    throw new Error(
      'El importe calculado excede la capacidad de Decimal128.'
    );
  }
}

function formatearImporte(valor) {
  return new Dinero(valor.toString()).toFixed(2);
}

function mostrarResumen(pedidos) {
  console.table(
    pedidos.map((pedido) => ({
      id: pedido._id.toString(),
      clienteId: pedido.clienteId.toString(),
      fecha: pedido.fecha.toISOString(),
      totalARS: formatearImporte(pedido.total),
      estado: pedido.estado,
      activo: pedido.activo
    }))
  );
}

function mostrarDetalle(pedido) {
  mostrarResumen([pedido]);

  console.log('\nDetalle del pedido:');

  console.table(
    pedido.items.map((item) => ({
      productoId: item.productoId.toString(),
      producto: item.nombreProducto,
      precioUnitarioARS: formatearImporte(item.precioUnitario),
      cantidad: Number(item.cantidad.toString()),
      subtotalARS: formatearImporte(item.subtotal)
    }))
  );
}

// CREATE: registra el pedido completo en un único documento.
async function crearPedido(db) {
  const clientes = db.collection('clientes');
  const productos = db.collection('productos');
  const pedidos = db.collection('pedidos');

  const clienteId = await pedirId('ID del cliente: ');

  const cliente = await clientes.findOne({
    _id: clienteId,
    activo: true
  });

  if (!cliente) {
    console.log('\nNo se encontró un cliente activo con ese ID.');
    return;
  }

  console.log(`\nCliente: ${cliente.nombre}`);

  const seleccion = [];
  let agregarOtro = true;

  while (agregarOtro) {
    const productoId = await pedirId('ID del producto: ');

    if (
      seleccion.some((item) => item.productoId.equals(productoId))
    ) {
      console.log(
        '\nEse producto ya está incluido. Agrega uno diferente.'
      );
      continue;
    }

    const producto = await productos.findOne({
      _id: productoId,
      activo: true
    });

    if (!producto) {
      console.log('\nNo se encontró un producto activo con ese ID.');
      return;
    }

    console.log(`Producto: ${producto.nombre}`);
    console.log(`Precio ARS: ${formatearImporte(producto.precio)}`);

    const cantidad = validarCantidad(
      await preguntar('Cantidad: ')
    );

    seleccion.push({ productoId, cantidad });

    let respuesta;

    do {
      respuesta = (
        await preguntar('¿Agregar otro producto? (s/n): ')
      ).toLowerCase();

      if (!['s', 'n'].includes(respuesta)) {
        console.log('Ingresa s o n.');
      }
    } while (!['s', 'n'].includes(respuesta));

    agregarOtro = respuesta === 's';
  }

  // Volvemos a consultar antes de preparar el pedido.
  // Así detectamos bajas y tomamos los precios actuales del catálogo.
  const clienteActivo = await clientes.findOne({
    _id: clienteId,
    activo: true
  });

  if (!clienteActivo) {
    throw new Error(
      'El cliente fue desactivado. No se registró el pedido.'
    );
  }

  const productosActuales = await productos.find({
    _id: { $in: seleccion.map((item) => item.productoId) },
    activo: true
  }).toArray();

  const productosPorId = new Map(
    productosActuales.map((producto) => [
      producto._id.toString(),
      producto
    ])
  );

  const items = [];
  let total = new Dinero(0);

  for (const item of seleccion) {
    const producto = productosPorId.get(
      item.productoId.toString()
    );

    if (!producto) {
      throw new Error(
        'Un producto fue desactivado o no está disponible. ' +
        'No se registró el pedido.'
      );
    }

    const precio = new Dinero(producto.precio.toString());

    if (
      !precio.isFinite() ||
      !precio.greaterThan(0) ||
      precio.decimalPlaces() > 2
    ) {
      throw new Error(
        `El producto "${producto.nombre}" tiene un precio inválido.`
      );
    }

    const subtotal = precio.times(item.cantidad);

    items.push({
      productoId: producto._id,
      nombreProducto: producto.nombre,
      precioUnitario: convertirImporte(precio),
      cantidad: new Int32(item.cantidad),
      subtotal: convertirImporte(subtotal)
    });

    total = total.plus(subtotal);
  }

  const pedido = {
    _id: new ObjectId(),
    clienteId,
    fecha: new Date(),
    items,
    total: convertirImporte(total),
    estado: 'pendiente',
    activo: true
  };

  console.log('\nResumen con los precios consultados en el catálogo:');
  mostrarDetalle(pedido);

  const confirmacion = (
    await preguntar('¿Confirmas el pedido? (s/n): ')
  ).toLowerCase();

  if (confirmacion !== 's') {
    console.log('\nOperación cancelada. No se guardó el pedido.');
    return;
  }

  // Comprobación final de referencias activas antes de insertar.
  const clienteVigente = await clientes.findOne({
    _id: clienteId,
    activo: true
  });

  const cantidadProductosActivos = await productos.countDocuments({
    _id: { $in: seleccion.map((item) => item.productoId) },
    activo: true
  });

  if (
    !clienteVigente ||
    cantidadProductosActivos !== seleccion.length
  ) {
    throw new Error(
      'El cliente o algún producto dejó de estar activo. ' +
      'No se registró el pedido.'
    );
  }

  pedido.fecha = new Date();

  await pedidos.insertOne(pedido);

  console.log(`\nPedido creado. ID: ${pedido._id.toString()}`);
}

// READ: lista únicamente pedidos activos.
async function listarPedidos(coleccion) {
  const pedidos = await coleccion
    .find({ activo: true })
    .sort({ fecha: -1 })
    .toArray();

  if (pedidos.length === 0) {
    console.log('\nNo hay pedidos activos.');
    return;
  }

  mostrarResumen(pedidos);
}

// READ por ID: muestra el resumen y el detalle histórico.
async function buscarPedido(coleccion) {
  const id = await pedirId('ID del pedido: ');

  const pedido = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!pedido) {
    console.log('\nNo se encontró un pedido activo con ese ID.');
    return;
  }

  mostrarDetalle(pedido);
}

// UPDATE: cambia el estado sin modificar el detalle de compra.
async function cambiarEstado(coleccion) {
  const id = await pedirId('ID del pedido: ');

  const pedido = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!pedido) {
    console.log('\nNo se encontró un pedido activo con ese ID.');
    return;
  }

  mostrarResumen([pedido]);

  if (pedido.estado !== 'pendiente') {
    console.log(
      '\nSolo se puede cambiar el estado de un pedido pendiente.'
    );
    return;
  }

  const nuevoEstado = (
    await preguntar('Nuevo estado (entregado/cancelado): ')
  ).toLowerCase();

  if (!['entregado', 'cancelado'].includes(nuevoEstado)) {
    throw new Error('El estado debe ser entregado o cancelado.');
  }

  const resultado = await coleccion.updateOne(
    {
      _id: id,
      activo: true,
      estado: 'pendiente'
    },
    {
      $set: { estado: nuevoEstado }
    }
  );

  if (resultado.matchedCount === 0) {
    console.log(
      '\nEl pedido cambió de estado o fue desactivado. Vuelve a consultarlo.'
    );
    return;
  }

  console.log(`\nEstado actualizado a ${nuevoEstado}.`);
}

// DELETE lógico: conserva el pedido completo en MongoDB.
async function desactivarPedido(coleccion) {
  const id = await pedirId('ID del pedido: ');

  const pedido = await coleccion.findOne({
    _id: id,
    activo: true
  });

  if (!pedido) {
    console.log('\nNo se encontró un pedido activo con ese ID.');
    return;
  }

  mostrarResumen([pedido]);

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
    console.log('\nEl pedido ya no está disponible como activo.');
    return;
  }

  console.log(
    '\nPedido desactivado. El documento y su detalle permanecen en la base.'
  );
}

export async function menuPedidos() {
  let volver = false;

  while (!volver) {
    console.log('\n===== PEDIDOS =====');
    console.log('1. Crear pedido');
    console.log('2. Listar pedidos activos');
    console.log('3. Buscar pedido activo por ID');
    console.log('4. Cambiar estado del pedido');
    console.log('5. Desactivar pedido');
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
      const coleccion = db.collection('pedidos');

      switch (opcion) {
        case '1':
          await crearPedido(db);
          break;

        case '2':
          await listarPedidos(coleccion);
          break;

        case '3':
          await buscarPedido(coleccion);
          break;

        case '4':
          await cambiarEstado(coleccion);
          break;

        case '5':
          await desactivarPedido(coleccion);
          break;
      }
    } catch (error) {
      console.log(
        `\nNo se pudo completar la operación: ${error.message}`
      );
    }
  }
}