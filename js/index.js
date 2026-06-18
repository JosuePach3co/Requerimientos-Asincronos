import { getSalesCoffee } from './requirements.js';

export const processSalesCoffee = async () => {
  try {
    const res = await getSalesCoffee();
    if (!res || !res.ok && res.status !== 0) {
      throw new Error(`Request failed${res && res.status ? ' (status: ' + res.status + ')' : ''}`);
    }

    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Error parsing XML');

    const root = xml.documentElement;
    const children = Array.from(root.children);

    // Detect repeated entry tag (e.g., <row>...</row> elements)
    const counts = {};
    children.forEach(c => counts[c.tagName] = (counts[c.tagName] || 0) + 1);
    let entryTag = null;
    for (const [tag, cnt] of Object.entries(counts)) {
      if (cnt > 1) { entryTag = tag; break; }
    }

    const entries = entryTag ? Array.from(root.getElementsByTagName(entryTag)) : children;

    const rows = entries.map((entry, idx) => {
      const fields = Array.from(entry.children);
      const obj = {};

      // Heurísticas para mapear campos comunes a las columnas: id, nombre, email, estado
      fields.forEach(f => {
        const name = f.tagName.toLowerCase();
        const value = (f.textContent || '').trim();
        if (!obj.id && (name === 'id' || name.includes('id') || name === 'saleid')) obj.id = value;
        if (!obj.nombre && (name === 'name' || name === 'nombre' || name.includes('product') || name.includes('client') || name.includes('buyer'))) obj.nombre = value;
        if (!obj.email && (name.includes('mail') || name === 'email' || name === 'correo')) obj.email = value;
        if (!obj.estado && (name === 'status' || name === 'estado' || name === 'state')) obj.estado = value;
      });

      // Fallbacks: usar las primeras columnas si las heurísticas no llenaron los campos
      if (!obj.id) obj.id = (fields[0] && (fields[0].textContent || '').trim()) || (idx + 1);
      if (!obj.nombre) obj.nombre = (fields[1] && (fields[1].textContent || '').trim()) || '';
      if (!obj.email) obj.email = (fields[2] && (fields[2].textContent || '').trim()) || '';
      if (!obj.estado) obj.estado = (fields[3] && (fields[3].textContent || '').trim()) || '';

      return obj;
    });

    // Usar helper global `loadTable` si está disponible
    if (window.loadTable && typeof window.loadTable === 'function') {
      window.loadTable(rows);
    } else {
      // Insertar filas directamente si no existe loadTable
      const tbody = document.getElementById('datatable-body');
      if (!tbody) return;
      tbody.innerHTML = '';
      rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${r.id}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${r.nombre}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${r.email}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${r.estado}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm"><button class="text-indigo-600 hover:text-indigo-900">Ver</button></td>
        `;
        tbody.appendChild(tr);
      });
    }

  } catch (err) {
    console.error('processSalesCoffee error:', err);
    const tbody = document.getElementById('datatable-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-sm text-red-600">Error cargando datos: ${err.message}</td></tr>`;
  }
};

// Ejecutar luego de cargarse la página
document.addEventListener('DOMContentLoaded', () => {
  processSalesCoffee();
});
