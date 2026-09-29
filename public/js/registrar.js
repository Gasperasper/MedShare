if (iniciarPagina()) {
    $('fechaCaducidad').min = new Date().toISOString().slice(0, 10); // sin fechas pasadas

    // El equipo médico no caduca: la fecha es opcional
    const etiquetaFecha = document.querySelector('label[for="fechaCaducidad"]');
    const ajustarFecha = () => {
        const opcional = $('categoria').value === 'Equipo médico';
        $('fechaCaducidad').required = !opcional;
        etiquetaFecha.textContent = opcional ? 'Fecha de caducidad (opcional)' : 'Fecha de caducidad';
    };
    $('categoria').addEventListener('change', ajustarFecha);

    $('insumoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            nombreInsumo: $('nombreInsumo').value.trim(), categoria: $('categoria').value,
            cantidad: Number($('cantidad').value), fechaCaducidad: $('fechaCaducidad').value
        };
        mostrarMsg($('resultado'), 'info', 'Guardando...');
        try {
            const r = await api('/api/insumos', { method: 'POST', body: JSON.stringify(body) });
            if (r.ok) { mostrarMsg($('resultado'), 'success', r.data.mensaje); $('insumoForm').reset(); ajustarFecha(); }
            else mostrarMsg($('resultado'), 'error', r.data.error || `Error ${r.status}`);
        } catch {
            mostrarMsg($('resultado'), 'error', 'No se pudo conectar con el servidor. Verifica que esté encendido.');
        }
    });
}