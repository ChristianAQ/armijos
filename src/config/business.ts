import type { BusinessSettings } from "../types";

// Valores de partida para los datos del emisor: se usan la primera vez (antes
// de guardar nada en Ajustes) y como respaldo si algún campo queda vacío. La
// edición real vive en Ajustes → Datos de la empresa (ver settings.service).
export const DEFAULT_BUSINESS: BusinessSettings = {
  name: "JARDINERIA Y MANTENIMIENTO",
  owner: "Enrique Armijos Robles",
  dni: "51705943B",
  email: "enrique-77@hotmail.es",
  phone: "680 442 376",
  address: "C/ Camino de Valderribas 96,\nMadrid, C.P 28038",
  termsText: "Si tiene alguna pregunta acerca de esta factura, póngase en contacto con\nEnrique Armijos Robles 680442376",
  bankAccount: "",
};

// Nombre de marca del logotipo (imagen fija, no editable en Ajustes).
export const BRAND = "ARMIJOS";
