let insumos = [];
if (iniciarPagina()) cargar();
const fechaDe = (i) => i.fechaCaducidad.slice(0, 10);

function diasParaVencer(fecha) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return Math.round((new Date(fecha + 'T00:00:00') - hoy) / 86400000);
}
function estadoDe(fecha) {
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

function pintar() {
    const q = $('fBuscar').value.trim().toLowerCase(), cat = $('fCategoria').value;
    const soloPorVencer = $('fPorVencer').checked, ocultarVencidos = $('fOcultarVencidos').checked;
    const esAdmin = getUser().rol === 'admin';

    const lista = insumos.filter(i => {
        const d = diasParaVencer(fechaDe(i));
        return (!q || i.nombreInsumo.toLowerCase().includes(q)) && (!cat || i.categoria === cat)
            && (!soloPorVencer || (d >= 0 && d <= 30)) && (!ocultarVencidos || d >= 0);
    }).sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)));

    $('tbody').replaceChildren();
    lista.forEach(i => {
        const tr = document.createElement('tr'), est = estadoDe(fechaDe(i));
        [i.nombreInsumo, i.categoria, i.cantidad, fechaDe(i)].forEach(v => celda(tr, v));
        const badge = document.createElement('span');
        badge.className = 'badge ' + est.cls; badge.textContent = est.txt;
        celda(tr, '').appendChild(badge);
        const acc = celda(tr, '');
        if (esAdmin) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'btn-link danger'; b.textContent = 'Dar de baja';
            b.addEventListener('click', async () => {
                if (!confirm(`¿Dar de baja "${i.nombreInsumo}"?`)) return;
                const r = await api('/api/insumos/' + i.id, { method: 'DELETE' });
                r.ok ? cargar() : alert(r.data.error || 'No se pudo dar de baja.');
            });
            acc.appendChild(b);
        }
        $('tbody').appendChild(tr);
    });
    $('vacio').hidden = lista.length > 0;
}
['fBuscar', 'fCategoria', 'fPorVencer', 'fOcultarVencidos'].forEach(id => $(id).addEventListener('input', pintar));