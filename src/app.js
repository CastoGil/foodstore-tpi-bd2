/**
 * Food Store — TPI de Bases de Datos II.
 *
 * Punto de entrada y menú principal.
 * Desde aquí se accede a clientes, productos y pedidos.
 *
 * Implementación inicial: Ricardo.
 * Revisión e integración: Ricardo y Maca.
 *
 * Al finalizar, se cierran la conexión a MongoDB y la consola.
 */

import "dotenv/config";
import { preguntar, cerrarConsola } from "./consola/entrada.js";
import { cerrarConexion } from "./config/conexion.js";
import { menuClientes } from "./operaciones/clientes.js";
import { menuProductos } from "./operaciones/productos.js";
import { menuPedidos } from "./operaciones/pedidos.js";

async function main() {
  let salir = false;

  console.log("\nBienvenido a Food Store");
  console.log("Trabajo Práctico Integrador - Bases de Datos II");

  while (!salir) {
    console.log("\n===== MENÚ PRINCIPAL =====");
    console.log("1. Gestionar clientes");
    console.log("2. Gestionar productos");
    console.log("3. Gestionar pedidos");
    console.log("0. Salir");

    const opcion = await preguntar("Selecciona una opción: ");

    switch (opcion) {
      case "1":
        await menuClientes();
        break;

      case "2":
        await menuProductos();
        break;

      case "3":
        await menuPedidos();
        break;

      case "0":
        salir = true;
        console.log("\nPrograma finalizado.");
        break;

      default:
        console.log("\nOpción inválida. Ingresa 1, 2, 3 o 0.");
    }
  }
}

try {
  await main();
} catch (error) {
  console.error("\nError de ejecución:", error.message);
  process.exitCode = 1;
} finally {
  try {
    await cerrarConexion();
  } finally {
    cerrarConsola();
  }
}
