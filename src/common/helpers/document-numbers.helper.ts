/** YYYYMMDD (local date). */
export function documentDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Bilty: CNS + YYYYMMDD + 4-digit daily sequence (e.g. CNS202604280001). */
export function biltyNumberPrefix(date: Date = new Date()): string {
  return `CNS${documentDateKey(date)}`;
}

/** Manifest: MAN + YYYYMMDD + 4-digit daily sequence (e.g. MAN202604280001). */
export function manifestNumberPrefix(date: Date = new Date()): string {
  return `MAN${documentDateKey(date)}`;
}

export function appendDailySequence(prefix: string, sequence: number): string {
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}
