// Простой loader для JSON уровней
export async function loadLevelJSON(path) {
  const res = await fetch(path, {cache: "no-store"});
  if (!res.ok) throw new Error(`Не удалось загрузить уровень: ${path}`);
  return await res.json();
}