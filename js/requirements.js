// requests for future use
const COFFEE_SALES_URL = 'https://raw.githubusercontent.com/DATA-DAWM/Datos/main/Coffee/Coffe_sales.xml';

export const getSalesCoffee = async () => {
  // Realiza únicamente la solicitud asíncrona al recurso indicado.
  return fetch(COFFEE_SALES_URL);
};
