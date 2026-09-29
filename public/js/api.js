// Utilidades compartidas: sesión, peticiones con JWT y mensajes.
const API = location.protocol === 'file:' ? 'http://localhost:3000' : '';
const $ = (id) => document.getElementById(id);
const getToken = () => localStorage.getItem('medshare_token');
const getUser = () => JSON.parse(localStorage.getItem('medshare_user') || 'null');

function guardarSesion(token, user) {
    localStorage.setItem('medshare_token', token);
    localStorage.setItem('medshare_user', JSON.stringify(user));
}
function cerrarSesion() {
    localStorage.removeItem('medshare_token');
    localStorage.removeItem('medshare_user');
    location.replace('login.html');
}
function mostrarMsg(el, tipo, texto) { el.className = 'msg ' + tipo; el.textContent = texto; }

async function api(ruta, opciones = {}) {
    const res = await fetch(API + ruta, {
        ...opciones,
        headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: 'Bearer ' + getToken() }) }
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && getToken()) cerrarSesion(); // sesión expirada
    return { ok: res.ok, status: res.status, data };
}

// Páginas privadas: exige sesión y llena la barra superior.
function iniciarPagina() {
    if (!getToken() || !getUser()) { location.replace('login.html'); return false; }
    $('userInfo').textContent = `${getUser().nombre} (${getUser().rol})`;
    $('logoutBtn').addEventListener('click', cerrarSesion);
    return true;
}