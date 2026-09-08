import { repository } from './database.js';

export function validateTeacher(data, teachers, currentId = null) {
  const errors = {};
  if (!data.name.trim()) errors.name = 'El nombre completo es obligatorio.';
  if (!data.code.trim()) errors.code = 'El identificador institucional es obligatorio.';
  if (!data.specialty) errors.specialty = 'Seleccione una especialidad.';
  if (!/^\+?[0-9 ()-]{7,20}$/.test(data.phone.trim())) errors.phone = 'Ingrese un teléfono válido.';
  if (teachers.some(t => t.code.toLowerCase() === data.code.trim().toLowerCase() && t.id !== currentId)) errors.code = 'Este identificador ya está registrado.';
  return errors;
}
export async function saveTeacher(data, id) {
  const teacher = { ...data, id: id || crypto.randomUUID(), code: data.code.trim(), name: data.name.trim(), phone: data.phone.trim(), updatedAt: new Date().toISOString() };
  await repository.save(teacher);
  return teacher;
}
export async function listTeachers(filters = {}) {
  const teachers = await repository.getAll();
  const query = (filters.query || '').toLowerCase().trim();
  return teachers.filter(t => t.active !== false).filter(t => {
    const matchesText = !query || [t.name, t.code, t.specialty, ...(t.assignments || []).flatMap(a => [a.grade, a.section, a.shift, a.subject])].join(' ').toLowerCase().includes(query);
    return matchesText && (!filters.shift || t.assignments?.some(a => a.shift === filters.shift));
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
