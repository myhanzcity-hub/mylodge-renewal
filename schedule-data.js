// Pure calendar rules for an explicitly labelled, non-booking demonstration.
const DAY = 86400000;
export const DEFAULT_YEAR = 2027;
export const HOLD_EXAMPLE = Object.freeze({start: '07-15', end: '08-23', weekdays: [5, 6]});

export function buildYear({year = DEFAULT_YEAR, product = 'domestic', domesticHold = true} = {}) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new RangeError('Invalid calendar year');
  if (!['domestic', 'thailand'].includes(product)) throw new TypeError('Unknown product');
  const start = Date.UTC(year, 0, 1), end = Date.UTC(year + 1, 0, 1);
  return Array.from({length: (end - start) / DAY}, (_, index) => {
    const date = new Date(start + index * DAY), iso = date.toISOString().slice(0, 10);
    const monthDay = iso.slice(5), weekday = date.getUTCDay();
    const held = product === 'domestic' && domesticHold && monthDay >= HOLD_EXAMPLE.start && monthDay <= HOLD_EXAMPLE.end && HOLD_EXAMPLE.weekdays.includes(weekday);
    return {iso, index, year, month: date.getUTCMonth() + 1, day: date.getUTCDate(), weekday, product, group: Math.floor(index / 3), tone: Math.floor(index / 3) % 3, status: held ? 'operator-hold-example' : 'practice-available'};
  });
}

export function dateLabel(iso) {
  const [, month, day] = iso.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

export function selectionFor(days, iso, mode = 'three') {
  const day = days.find(item => item.iso === iso);
  if (!day) return {ok: false, reason: '해당 연도의 날짜를 선택해 주세요', dates: []};
  if (!['three', 'single'].includes(mode)) return {ok: false, reason: '선택 단위를 확인해 주세요', dates: []};
  if (mode === 'single' && day.product !== 'domestic') return {ok: false, reason: '비연속 1일 선택은 국내 운영안에서만 연습할 수 있습니다', dates: []};
  const group = mode === 'single' ? [day] : days.filter(item => item.group === day.group);
  if (mode === 'three' && group.length < 3) return {ok: false, reason: `연말에 남은 ${group.length}일은 3일 구간이 아닙니다 이월·잔여일 운영 기준은 확인이 필요합니다.`, dates: []};
  const held = group.filter(item => item.status === 'operator-hold-example');
  if (held.length) return {ok: false, reason: `${held.map(item => dateLabel(item.iso)).join(', ')}에 운영사 홀드 예시가 포함되어 선택할 수 없습니다 실제 예약 완료 표시가 아닙니다.`, dates: []};
  return {ok: true, dates: group.map(item => item.iso), reason: ''};
}

export function toggleSelection(days, iso, mode, selected = []) {
  const choice = selectionFor(days, iso, mode);
  if (!choice.ok) return {...choice, selected: [...selected]};
  const next = new Set(selected), removing = choice.dates.every(date => next.has(date));
  for (const date of choice.dates) removing ? next.delete(date) : next.add(date);
  return {...choice, selected: [...next].sort(), action: removing ? 'removed' : 'added'};
}

export function calendarMonths(days) {
  return Array.from({length: 12}, (_, index) => days.filter(day => day.month === index + 1));
}
