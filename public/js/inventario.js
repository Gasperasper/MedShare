let insumos = [];
if (iniciarPagina()) cargar();
const fechaDe = (i) => (i.fechaCaducidad || '').slice(0, 10);

function diasParaVencer(fecha) {
    if (!fecha) return Infinity; // sin caducidad
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(fecha + 'T00:00:00') - hoy) / 86400000);
}
function estadoDe(fecha) {
    if (!fecha) return { txt: 'Sin caducidad', cls: 'sin-caducidad' };
    const d = diasParaVencer(fecha);
    if (d < 0) return { txt: 'Vencido', cls: 'vencido' };
    if (d <= 30) return { txt: `Vence en ${d} d`, cls: 'por-vencer' };
    return { txt: 'Vigente', cls: 'vigente' };
}

async function cargar() {
    const r = await api('/api/insumos');
    insumos = r.ok ? r.data : [];
    pintar();
}

function celda(tr, texto) { const td = document.createElement('td'); td.textContent = texto; tr.appendChild(td); return td; }
function boton(texto, clase, fn) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-link ' + clase; b.textContent = texto;
    b.addEventListener('click', fn);
    return b;
}

// Cambia la celda de cantidad por un campo editable (solo admin)
function editarCantidad(insumo, td) {
    const input = document.createElement('input');
    input.type = 'number'; input.min = 0; input.value = insumo.cantidad; input.className = 'cant-input';
    const guardar = boton('Guardar', '', async () => {
        if (input.value === '') return alert('Escribe una cantidad.');
        const r = await api(`/api/insumos/${insumo.id}/cantidad`, { method: 'PATCH', body: JSON.stringify({ cantidad: Number(input.value) }) });
        r.ok ? cargar() : alert(r.data.error || 'No se pudo actualizar la cantidad.');
    });
    td.replaceChildren(input, guardar, boton('Cancelar', '', pintar));
    input.focus();
}

function pintar() {
    const q = $('fBuscar').value.trim().toLowerCase(), cat = $('fCategoria').value;
    const soloPorVencer = $('fPorVencer').checked, ocultarVencidos = $('fOcultarVencidos').checked;
    const esAdmin = getUser().rol === 'admin';

    const lista = insumos.filter(i => {
        const d = diasParaVencer(fechaDe(i));
        return (!q || i.nombreInsumo.toLowerCase().includes(q)) && (!cat || i.categoria === cat)
            && (!soloPorVencer || (d >= 0 && d <= 30)) && (!ocultarVencidos || d >= 0);
    }).sort((a, b) => (fechaDe(a) || '9999').localeCompare(fechaDe(b) || '9999')); // sin caducidad al final

    $('tbody').replaceChildren();
    lista.forEach(i => {
        const tr = document.createElement('tr'), est = estadoDe(fechaDe(i));
        celda(tr, i.nombreInsumo); celda(tr, i.categoria);
        const tdCant = celda(tr, i.cantidad);
        celda(tr, fechaDe(i) || '—');
        const badge = document.createElement('span');
        badge.className = 'badge ' + est.cls; badge.textContent = est.txt;
        celda(tr, '').appendChild(badge);
        const acc = celda(tr, '');
        if (esAdmin) {
            acc.appendChild(boton('Editar cantidad', '', () => editarCantidad(i, tdCant)));
            acc.appendChild(boton('Dar de baja', 'danger', async () => {
                if (!confirm(`¿Dar de baja "${i.nombreInsumo}"?`)) return;
                const r = await api('/api/insumos/' + i.id, { method: 'DELETE' });
                r.ok ? cargar() : alert(r.data.error || 'No se pudo dar de baja.');
            }));
        }
        $('tbody').appendChild(tr);
    });
    $('vacio').hidden = lista.length > 0;
}
['fBuscar', 'fCategoria', 'fPorVencer', 'fOcultarVencidos'].forEach(id => $(id).addEventListener('input', pintar));