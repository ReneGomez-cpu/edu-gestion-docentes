import { auth } from './services/auth.js';
import { repository } from './services/database.js';
import { deactivateTeacher, listTeachers, reactivateTeacher, saveTeacher, validateTeacher } from './services/teachers.js';
import { shell } from './components/layout.js';
import { assignmentRow, teacherForm } from './components/teacher-form.js';

const app = document.querySelector('#app');
let page = 'dashboard';
let activeModal = null;
let teacherStatus = 'active';
const canManageTeachers = () => auth.current()?.role === 'admin';
const escapes = value => String(value || '').replace(/[&<>"']/g, x => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[x]);
function flash(message, type = 'success') { document.querySelector('.toast')?.remove(); app.insertAdjacentHTML('beforeend', `<div class="toast ${type}">${type === 'success' ? '✓' : '!'} ${message}</div>`); setTimeout(() => document.querySelector('.toast')?.remove(), 3600); }

async function loginView() {
  app.innerHTML = `<div class="login-page"><section class="login-art"><div class="login-logo"><span>E</span> EduGestión</div><div><p class="eyebrow">PORTAL INSTITUCIONAL</p><h1>La gestión docente, más clara y segura.</h1><p>Centralice información, asignaciones y necesidades de su equipo académico en un solo lugar.</p></div><div class="security-note">◆ Acceso protegido por roles<br>◆ Información organizada y privada</div></section><section class="login-panel"><form id="login-form"><p class="eyebrow">BIENVENIDO</p><h2>Ingrese a su cuenta</h2><p class="muted">Use sus credenciales institucionales para continuar.</p><label>Correo institucional<input type="email" name="email" required autocomplete="email"></label><label>Contraseña<input type="password" name="password" required autocomplete="current-password"></label><button class="button primary full" type="submit">Iniciar sesión →</button><p id="login-error" class="form-error"></p></form></section></div>`;
  document.querySelector('#login-form').addEventListener('submit', async e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); try { await auth.signIn(data.email, data.password); render(); } catch (error) { document.querySelector('#login-error').textContent = error.message; } });
}
function metrics(teachers) { const assignments = teachers.flatMap(t => t.assignments || []); const cards = [['Docentes activos', teachers.length, '♙'],['Asignaciones', assignments.length, '▤'],['Requieren equipo', teachers.filter(t => t.needsEquipment === 'Sí').length, '!'],['Especialidades', new Set(teachers.map(t => t.specialty)).size, '◈']]; const shifts = ['Matutino','Vespertino'].map(s => [s, assignments.filter(a => a.shift === s).length]); const total = Math.max(1, shifts.reduce((a, [, n]) => a+n, 0)); return `<div class="metrics">${cards.map(([title,value,ico]) => `<article class="metric"><span>${ico}</span><div><small>${title}</small><strong>${value}</strong><em>Actualizado ahora</em></div></article>`).join('')}</div><section class="dashboard-grid"><article class="card chart"><div class="card-title"><div><p class="eyebrow">DISTRIBUCIÓN</p><h2>Asignaciones por turno</h2></div><span class="chip">Período actual</span></div><div class="bars">${shifts.map(([name,count]) => `<div><div class="bar-label"><span>${name}</span><strong>${count}</strong></div><div class="bar-track"><i style="width:${count/total*100}%"></i></div></div>`).join('')}</div></article><article class="card"><p class="eyebrow">ATENCIÓN</p><h2>Necesidades de equipo</h2><div class="equipment-count">${teachers.filter(t=>t.needsEquipment==='Sí').length}</div><p class="muted">docentes requieren asignación o renovación de equipo.</p></article></section>`; }
async function dashboardView() { const teachers = await listTeachers(); return shell(auth.current(), 'dashboard', `<div class="content"><div class="page-intro"><div><p class="muted">Vista general de la operación académica.</p></div>${canManageTeachers() ? '<button class="button primary" data-action="new-teacher">+ Registrar docente</button>' : ''} </div>${metrics(teachers)}<section class="card activity"><div class="card-title"><h2>Docentes registrados recientemente</h2><button class="text-button" data-route="teachers">Ver directorio →</button></div>${teachers.slice(0,4).map(t=>`<div class="activity-row"><div class="avatar">${t.name.slice(0,1)}</div><div><strong>${escapes(t.name)}</strong><small>${escapes(t.specialty)} · ${escapes(t.code)}</small></div><span class="status">${t.status || 'Activo'}</span></div>`).join('') || '<p class="empty">Aún no hay docentes registrados.</p>'}</section></div>`); }
function teacherRows(teachers, manageTeachers, showInactive) {
  return teachers.map(teacher => `<tr><td><div class="person"><span class="avatar">${teacher.name.slice(0, 1)}</span><div><button class="teacher-link" data-action="view-teacher" data-id="${teacher.id}"><strong>${escapes(teacher.name)}</strong><small>${escapes(teacher.code)}</small></button></div></div></td><td>${escapes(teacher.specialty)}</td><td>${(teacher.assignments || []).map(assignment => `${escapes(assignment.grade)} ${escapes(assignment.section)}`).join(', ') || 'Sin asignación'}</td><td><span class="status ${showInactive ? 'inactive-status' : ''}">${showInactive ? 'Inactivo' : escapes(teacher.status || 'Activo')}</span></td>${manageTeachers ? `<td>${showInactive ? `<button class="button secondary reactivate-button" data-action="reactivate-teacher" data-id="${teacher.id}">Reactivar</button>` : `<button class="icon-button" data-action="edit-teacher" data-id="${teacher.id}" title="Editar">✎</button>`}</td>` : ''}</tr>`).join('');
}

async function teachersView() {
  const manageTeachers = canManageTeachers();
  const showInactive = manageTeachers && teacherStatus === 'inactive';
  const teachers = await listTeachers({ status: showInactive ? 'inactive' : 'active' });
  const rows = teacherRows(teachers, manageTeachers, showInactive);
  const statusFilter = manageTeachers ? `<select id="status-filter" aria-label="Estado de docentes"><option value="active" ${showInactive ? '' : 'selected'}>Docentes activos</option><option value="inactive" ${showInactive ? 'selected' : ''}>Docentes inactivos</option></select>` : '';
  const countLabel = showInactive ? `${teachers.length} docentes inactivos en el historial.` : `${teachers.length} docentes activos en el directorio.`;
  const emptyMessage = showInactive ? 'No hay docentes inactivos.' : 'No se encontraron docentes.';
  const columnCount = manageTeachers ? 5 : 4;

  return shell(auth.current(), 'teachers', `<div class="content"><div class="page-intro"><p class="muted">${countLabel}</p>${manageTeachers && !showInactive ? '<button class="button primary" data-action="new-teacher">+ Registrar docente</button>' : ''}</div><section class="card directory"><div class="filters"><label class="search">⌕ <input id="search" placeholder="Buscar por nombre, código, especialidad, grado..." /></label><select id="shift-filter"><option value="">Todos los turnos</option><option>Matutino</option><option>Vespertino</option></select>${statusFilter}</div><div class="table-wrap"><table><thead><tr><th>DOCENTE</th><th>ESPECIALIDAD</th><th>ASIGNACIONES</th><th>ESTADO</th>${manageTeachers ? '<th></th>' : ''}</tr></thead><tbody>${rows || `<tr><td colspan="${columnCount}" class="empty">${emptyMessage}</td></tr>`}</tbody></table></div></section></div>`);
}
async function usersView() { const users=await repository.getUsers(); return shell(auth.current(),'users',`<div class="content"><div class="page-intro"><p class="muted">Roles de acceso registrados. Los nuevos usuarios se gestionan desde Firebase Authentication en producción.</p></div><section class="card directory"><div class="table-wrap"><table><thead><tr><th>USUARIO</th><th>CORREO</th><th>ROL</th><th>ESTADO</th></tr></thead><tbody>${users.map(u=>`<tr><td><strong>${escapes(u.name)}</strong></td><td>${escapes(u.email)}</td><td>${u.role==='admin'?'Administrador':'Usuario autorizado'}</td><td><span class="status">Activo</span></td></tr>`).join('')}</tbody></table></div></section></div>`); }
async function render() { await auth.restore(); if (!auth.current()) return loginView(); app.innerHTML = page === 'dashboard' ? await dashboardView() : page === 'teachers' ? await teachersView() : await usersView(); bindShell(); }
function bindShell() { app.querySelectorAll('[data-route]').forEach(b => b.onclick = () => { page = b.dataset.route; render(); }); app.querySelector('[data-action="menu"]')?.addEventListener('click',()=>app.querySelector('.sidebar').classList.toggle('visible')); app.querySelector('[data-action="signout"]')?.addEventListener('click',()=>{auth.signOut(); loginView();}); app.querySelector('[data-action="new-teacher"]')?.addEventListener('click',()=>openTeacher()); app.querySelectorAll('[data-action="view-teacher"]').forEach(b => b.onclick = async () => openTeacherProfile(await repository.get(b.dataset.id))); app.querySelectorAll('[data-action="edit-teacher"]').forEach(b=>b.onclick=async()=>openTeacher(await repository.get(b.dataset.id))); app.querySelectorAll('[data-action="reactivate-teacher"]').forEach(button => button.onclick = async () => reactivateTeacherRecord(button.dataset.id)); const search = app.querySelector('#search'); if(search) search.oninput = filterTable; app.querySelector('#shift-filter')?.addEventListener('change',filterTable); app.querySelector('#status-filter')?.addEventListener('change', event => { teacherStatus = event.target.value; render(); }); }
async function filterTable() {
  const manageTeachers = canManageTeachers();
  const showInactive = manageTeachers && teacherStatus === 'inactive';
  const visible = await listTeachers({
    query: document.querySelector('#search').value,
    shift: document.querySelector('#shift-filter').value,
    status: showInactive ? 'inactive' : 'active',
  });
  const body = document.querySelector('tbody');
  body.innerHTML = teacherRows(visible, manageTeachers, showInactive) || `<tr><td colspan="${manageTeachers ? 5 : 4}" class="empty">Sin coincidencias para su búsqueda.</td></tr>`;
  bindShell();
}

async function reactivateTeacherRecord(id) {
  const teacher = await repository.get(id);
  if (!teacher) {
    flash('No se encontró el docente solicitado.', 'error');
    return;
  }
  if (!window.confirm(`¿Desea reactivar a ${teacher.name}? Volverá a aparecer en el directorio activo.`)) return;

  try {
    await reactivateTeacher(teacher);
    flash('Docente reactivado correctamente.');
    render();
  } catch (error) {
    console.error('Error al reactivar docente:', error);
    flash(firestoreErrorMessage(error), 'error');
  }
}

function teacherProfile(teacher) {
  const assignments = teacher.assignments || [];
  const assignmentList = assignments.length
    ? assignments.map(assignment => `<div class="profile-assignment"><div><strong>${escapes(assignment.grade)} ${escapes(assignment.section)}</strong><small>${escapes(assignment.subject)}</small></div><span class="chip">${escapes(assignment.shift)}</span></div>`).join('')
    : '<p class="empty">Este docente no tiene asignaciones registradas.</p>';

  return `<div class="modal-backdrop"><section class="modal teacher-profile"><button class="modal-close" data-action="close-profile" aria-label="Cerrar ficha">×</button><p class="eyebrow">FICHA INDIVIDUAL</p><div class="profile-title"><span class="avatar">${escapes(teacher.name).slice(0, 1).toUpperCase()}</span><div><h2>${escapes(teacher.name)}</h2><p>${escapes(teacher.code)}</p></div><span class="status">${escapes(teacher.status || 'Activo')}</span></div><div class="profile-details"><div><small>ESPECIALIDAD</small><strong>${escapes(teacher.specialty)}</strong></div><div><small>TELÉFONO</small><strong>${escapes(teacher.phone)}</strong></div><div><small>NECESIDAD DE EQUIPO</small><strong>${escapes(teacher.needsEquipment || 'No requiere')}</strong></div><div><small>ESTADO</small><strong>${escapes(teacher.status || 'Activo')}</strong></div></div><section class="profile-section"><p class="eyebrow">CARGA ACADÉMICA</p><h3>Asignaciones</h3><div class="profile-assignments">${assignmentList}</div></section><section class="profile-section"><p class="eyebrow">OBSERVACIONES</p><p class="profile-notes">${teacher.notes ? escapes(teacher.notes) : 'Sin observaciones registradas.'}</p></section><div class="form-actions"><button type="button" class="button secondary" data-action="close-profile">Cerrar ficha</button></div></section></div>`;
}

function openTeacherProfile(teacher) {
  if (!teacher) {
    flash('No se encontró el docente solicitado.', 'error');
    return;
  }
  app.insertAdjacentHTML('beforeend', teacherProfile(teacher));
  const modal = document.querySelector('.modal-backdrop');
  modal.querySelectorAll('[data-action="close-profile"]').forEach(button => { button.onclick = () => modal.remove(); });
}

function openTeacher(teacher) { activeModal = teacher; app.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><section class="modal"><button class="modal-close" data-action="close-modal">×</button><p class="eyebrow">${teacher ? 'ACTUALIZAR REGISTRO' : 'NUEVO REGISTRO'}</p><h2>${teacher ? 'Editar docente' : 'Registrar docente'}</h2>${teacherForm(teacher)}</section></div>`); const modal = document.querySelector('.modal-backdrop'); modal.querySelectorAll('[data-action="close-modal"]').forEach(button => { button.onclick = () => modal.remove(); }); modal.querySelector('[data-action="add-assignment"]').onclick=()=>modal.querySelector('#assignments').insertAdjacentHTML('beforeend',assignmentRow()); modal.addEventListener('click',e=>{if(e.target.classList.contains('remove-assignment')) e.target.closest('.assignment-row').remove();}); modal.querySelector('[data-action="deactivate-teacher"]')?.addEventListener('click', async () => {
  if (!window.confirm(`¿Desea desactivar a ${activeModal.name}? El docente no se eliminará y podrá conservarse su historial.`)) return;
  try {
    await deactivateTeacher(activeModal);
    modal.remove();
    flash('Docente desactivado correctamente.');
    render();
  } catch (error) {
    console.error('Error al desactivar docente:', error);
    flash(firestoreErrorMessage(error), 'error');
  }
}); modal.querySelector('form').onsubmit=submitTeacher; }
function firestoreErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'Firebase rechazó el guardado: la cuenta debe tener rol administrador y estar activa en users/{UID}.';
  }
  if (error?.code === 'unavailable') {
    return 'No se pudo conectar con Firestore. Revise la conexión a Internet e intente de nuevo.';
  }
  return 'No se pudo guardar el docente. Intente nuevamente o revise la consola del navegador.';
}

async function submitTeacher(e) {
  e.preventDefault();
  const form = e.currentTarget;

  try {
    const teachers = await repository.getAll();
    // assignment-row es un div, no un formulario. FormData(row) produce un
    // TypeError y era lo que impedía registrar docentes.
    const assignments = [...form.querySelectorAll('.assignment-row')].map(row => ({
      grade: row.querySelector('[name="grade"]').value.trim(),
      section: row.querySelector('[name="section"]').value.trim(),
      subject: row.querySelector('[name="subject"]').value.trim(),
      shift: row.querySelector('[name="shift"]').value,
    }));
    const formData = Object.fromEntries(new FormData(form));
    const data = {
      ...formData,
      assignments,
      active: formData.status !== 'Inactivo',
    };
    const errors = validateTeacher(data, teachers, activeModal?.id);

    if (Object.keys(errors).length) {
      const modal = document.querySelector('.modal-backdrop');
      modal.remove();
      openTeacher({ ...data, id: activeModal?.id });
      flash(Object.values(errors)[0], 'error');
      return;
    }

    await saveTeacher(data, activeModal?.id);
    document.querySelector('.modal-backdrop').remove();
    flash(activeModal ? 'Docente actualizado correctamente.' : 'Docente registrado correctamente.');
    render();
  } catch (error) {
    console.error('Error al guardar docente:', error);
    flash(firestoreErrorMessage(error), 'error');
  }
}
render().catch(error => {
  console.error('Error al iniciar EduGestión:', error);
  app.innerHTML = `<section style="padding:24px;font-family:Arial,sans-serif"><h2>No se pudo iniciar la aplicación</h2><p>Abre la consola del navegador (F12) para ver el error.</p><pre style="white-space:pre-wrap;color:#a33">${escapes(error.message || error)}</pre></section>`;
});
