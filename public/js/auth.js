// Login y registro (según data-modo del <body>).
const modo = document.body.dataset.modo;
if (getToken()) location.replace('inventario.html');
if (new URLSearchParams(location.search).has('creada')) mostrarMsg($('authMsg'), 'success', 'Cuenta creada. Ahora inicia sesión.');

$('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('email').value.trim(), password = $('password').value;
    const nombre = modo === 'registro' ? $('nombre').value.trim() : undefined;
    if (!email || password.length < 6 || (modo === 'registro' && !nombre))
        return mostrarMsg($('authMsg'), 'error', 'Completa todos los campos. La contraseña necesita al menos 6 caracteres.');

    mostrarMsg($('authMsg'), 'info', 'Un momento...');
    try {
        const r = await api(`/api/auth/${modo === 'login' ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify({ nombre, email, password }) });
        if (!r.ok) return mostrarMsg($('authMsg'), 'error', r.data.error || `Error ${r.status}`);
        if (modo === 'registro') return location.replace('login.html?creada=1');
        guardarSesion(r.data.token, r.data.user);
        location.replace('inventario.html');
    } catch {
        mostrarMsg($('authMsg'), 'error', 'No se pudo conectar con el servidor. Verifica que esté encendido.');
    }
});