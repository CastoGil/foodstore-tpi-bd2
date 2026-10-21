# Food Store — Informe Técnico de Proyecto Integrador

**Trabajo Práctico Integrador — Bases de Datos II**  
**Integrantes:** Ricardo Casto y Macarena Larrosa  
**Fecha de actualización:** 20/10/2026  
**Estado:** Integración de infraestructura Atlas, modelado documental y conexión local completados; en proceso de validación final de pruebas CRUD y respaldos.

---

## 1. Introducción

Food Store es una solución académica de gestión comercial y registro de pedidos desarrollada sobre Node.js, orientada a administrar clientes, productos y órdenes transaccionales mediante el motor de base de datos documental MongoDB Atlas alojado en la nube. El proyecto implementa operaciones CRUD completas, relaciones mediante referencias (linking), estructuras embebidas (embedding), borrado lógico y políticas de resguardo físico.

Se optó por una interfaz de línea de comandos (CLI) interactiva para focalizar el desarrollo en el diseño del modelo de datos, la persistencia, el cumplimiento de tipos BSON y la validación de integridad referencial.

---

## 2. Descripción del Negocio y Alcance

### 2.1. Contexto y Propósito del Sistema
El proyecto Food Store surge como respuesta a los requerimientos operativos de un comercio gastronómico de comidas rápidas y cafetería. La plataforma centraliza el flujo de información de las tres entidades esenciales: clientes, catálogo de productos y comandas emitidas.

El propósito central radica en agilizar la atención en el punto de venta asegurando la inmutabilidad histórica de las ventas pasadas frente a fluctuaciones de precios o cambios de carta, aprovechando la alta disponibilidad y escalabilidad de un clúster MongoDB Atlas.

### 2.2. Entidades Principales
* **Clientes:** Almacena la identificación y datos de contacto del padrón de compradores. Asegura la unicidad mediante una restricción de índice único sobre el correo electrónico.
* **Productos:** Define el menú comercial categorizado (comidas, bebidas, postres), gestionando importes monetarios con tipos decimales de alta precisión (`Decimal128`).
* **Pedidos:** Registra las transacciones comerciales vinculadas a un cliente emisor y una o más líneas de productos, preservando la fidelidad de los importes al momento de la compra a través de documentos embebidos.

### 2.3. Funcionalidades Incluidas (En Alcance)
* **Gestión de Clientes:** Alta, listado de clientes activos, consulta por `ObjectId`, modificación de datos de contacto y baja lógica (`activo: false`).
* **Control de Catálogo:** Alta, actualización de precios, categorización y deshabilitación lógica de platos/bebidas.
* **Emisión de Pedidos:** Creación de pedidos compuestos, cálculo exacto de subtotales y totales acumulados, vinculación a clientes y seguimiento por estados (`pendiente`, `en preparación`, `entregado`, `cancelado`).
* **Seguridad e Infraestructura:** Despliegue en clúster MongoDB Atlas M0 (AWS sa-east-1) con autenticación SCRAM, filtrado de red por IP y resguardos mediante utilidades nativas (`mongodump` / `mongorestore`).

### 2.4. Exclusiones del Sistema (Fuera de Alcance)
1. **Sin pasarela de pagos online:** No integra servicios externos (Mercado Pago, Stripe); los cobros se gestionan manualmente en caja.
2. **Sin facturación fiscal:** No emite comprobantes electrónicos fiscales ni conecta con servidores de AFIP/ARCA.
3. **Sin control de stock automatizado:** No descuenta inventario físico de insumos al confirmar una comanda.
4. **Sin portal web de cliente:** La aplicación opera como consola interna de uso exclusivo para el personal del establecimiento.

---

## 3. Objetivos

**Objetivo general:** Diseñar, implementar y verificar una arquitectura de persistencia documental NoSQL con MongoDB Atlas para la administración integral de Food Store.

**Objetivos específicos:**
* Modelar entidades aplicando criterios formales de referencias (linking) y documentos embebidos (embedding).
* Implementar operaciones de manipulación y consulta desde Node.js respetando bajas lógicas.
* Garantizar consistencia monetaria mediante tipos BSON `Decimal128`.
* Desplegar y asegurar el clúster en la nube (Atlas) con reglas de red y usuarios con privilegios mínimos.
* Validar mecanismos de respaldo (`mongodump`) y evaluar objetivos de recuperación (RTO/RPO).

---

## 4. Tecnologías y Arquitectura

| Tecnología o componente | Uso en Food Store |
|---|---|
| Node.js (v20+) y npm | Entorno de ejecución y gestor de paquetes |
| Driver oficial `mongodb` | Driver nativo para comunicación TCP/TLS con el clúster |
| MongoDB Atlas (M0 Free Tier) | Motor de base de datos documental alojado en AWS São Paulo (`sa-east-1`) |
| `dotenv` | Carga segura de variables de entorno desde `.env` local |
| `decimal.js` | Manejo de aritmética de precisión arbitraria en capa de aplicación |
| BSON `Decimal128`, `Int32`, `ObjectId` | Tipos canónicos en la base de datos |
| PowerShell y `mongodump` | Automatización de rutinas de respaldo físico |
| Git y GitHub | Control de versiones colaborativo |

### Estructura modular del proyecto:
* `src/app.js`: Punto de entrada y menú interactivo por consola.
* `src/config/conexion.js`: Patrón singleton para conexión y desconexión con `MongoClient`.
* `src/consola/entrada.js`: Captura interactiva de entradas vía `readline/promises`.
* `src/operaciones/clientes.js`: Lógica de negocio, consultas y control de duplicados de clientes.
* `src/operaciones/productos.js`: Administración del catálogo y validación de precios.
* `src/operaciones/pedidos.js`: Armado de pedidos, cálculos de totales y control de estados.
* `scripts/backup.ps1`: Automatización del proceso de copia de seguridad con `mongodump`.

---

## 5. Infraestructura y Seguridad en MongoDB Atlas

El clúster fue aprovisionado sobre la infraestructura de AWS en la región São Paulo (`sa-east-1`), bajo el tier M0 con motor MongoDB 8.0.

![Visión General del Clúster](../capturas/atlas/cluster_overview.png)

### 5.1. Seguridad y Control de Accesos
* **Seguridad de Red (Network Access):** Se configuraron listas de control de acceso IP para posibilitar el tráfico autorizado desde las estaciones de desarrollo hacia el clúster.
![Configuración de Red](../capturas/atlas/network_access.png)

* **Autenticación (Database Access):** Se definió el usuario `app_foodstore` autenticado mediante el protocolo SCRAM, asegurando que las credenciales no figuren en el código fuente mediante variables de entorno.
![Usuario Database Access](../capturas/atlas/database_access.png)

* **Restricción de Unicidad en Base de Datos:** Se generó el índice `email_1` en la colección `clientes` con la propiedad `{ unique: true }`, previniendo inconsistencias a nivel de almacenamiento físico.
![Índice Único Email](../capturas/atlas/indice_email_unique.png)

---

## 6. Modelo Documental y Esquemas BSON

**Base de datos:** `foodstore_tpi`  
**Colecciones:** `clientes`, `productos` y `pedidos`.

### 6.1. Esquemas Canónicos BSON

```json
// Colección: clientes
{
  "_id": { "$oid": "6713dc01a1b2c3d4e5f60001" },
  "nombre": "Celeste Gómez",
  "email": "cele.gomez@mail.com",
  "telefono": "1144556677",
  "activo": true
}

// Colección: productos
{
  "_id": { "$oid": "6713dc02a1b2c3d4e5f60010" },
  "nombre": "Hamburguesa Clásica",
  "categoria": "comidas",
  "precio": { "$numberDecimal": "10500.00" },
  "activo": true
}

// Colección: pedidos
{
  "_id": { "$oid": "6713dc03a1b2c3d4e5f60020" },
  "clienteId": { "$oid": "6713dc01a1b2c3d4e5f60001" },
  "fecha": { "$date": "2026-10-18T19:30:00.000Z" },
  "items": [
    {
      "productoId": { "$oid": "6713dc02a1b2c3d4e5f60010" },
      "nombreProducto": "Hamburguesa Clásica",
      "precioUnitario": { "$numberDecimal": "10500.00" },
      "cantidad": { "$numberInt": "2" },
      "subtotal": { "$numberDecimal": "21000.00" }
    },
    {
      "productoId": { "$oid": "6713dc02a1b2c3d4e5f60012" },
      "nombreProducto": "Gaseosa Coca cola 500ml",
      "precioUnitario": { "$numberDecimal": "2500.00" },
      "cantidad": { "$numberInt": "1" },
      "subtotal": { "$numberDecimal": "2500.00" }
    }
  ],
  "total": { "$numberDecimal": "23500.00" },
  "estado": "pendiente",
  "activo": true
}