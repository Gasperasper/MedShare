document.getElementById('insumoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Capturamos los valores del formulario
    const nombreInsumo = document.getElementById('nombreInsumo').value.trim();
    const categoria = document.getElementById('categoria').value;
    const cantidad = Number(document.getElementById('cantidad').value);
    const fechaCaducidad = document.getElementById('fechaCaducidad').value;
    
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.className = '';
    resultadoDiv.textContent = 'Enviando solicitud al servidor...';

    try {
        const response = await fetch('http://localhost:3000/api/insumos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombreInsumo, categoria, cantidad, fechaCaducidad })
        });

        const data = await response.json();

        if (response.ok) {
            resultadoDiv.className = 'success';
            resultadoDiv.textContent = `¡Registro Exitoso! (Código HTTP: ${response.status})\n\n` + JSON.stringify(data, null, 2);
        } else {
            resultadoDiv.className = 'error';
            resultadoDiv.textContent = `Error en la Petición (Código HTTP: ${response.status})\n\n` + JSON.stringify(data, null, 2);
        }
    } catch (err) {
        resultadoDiv.className = 'error';
        resultadoDiv.textContent = 'Error de conexión:\nNo se pudo conectar con el servidor en http://localhost:3000.\n¿Aseguraste de encender el servidor Express?';
    }
});