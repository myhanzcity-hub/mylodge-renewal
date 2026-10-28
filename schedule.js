import {DEFAULT_YEAR, buildYear, calendarMonths, dateLabel, selectionFor, toggleSelection} from './schedule-data.js';

const $ = selector => document.querySelector(selector);
const calendar = $('#calendar'), yearField = $('#year'), holdField = $('#hold-example');
const feedback = $('#selection-feedback');
const productInputs = [...document.querySelectorAll('[name="product"]')], modeInputs = [...document.querySelectorAll('[name="mode"]')];
let year = DEFAULT_YEAR, product = new URLSearchParams(location.search).get('product') === 'thailand' ? 'thailand' : 'domestic', mode = product === 'thailand' ? 'three' : 'single', days = [], selected = [];
let feedbackReturnFocus = null;
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

function message(text, error = false) {
  feedbackReturnFocus = document.activeElement;
  feedback.hidden = false;
  feedback.dataset.error = String(error);
  $('#selection-message').textContent = text;
  $('#selection-message').dataset.error = String(error);
}

function renderSummary() {
  $('#selection-count').textContent = `${selected.length}일`;
  $('#selection-live-count').textContent = `${selected.length}일`;
  $('#selection-list').textContent = selected.length ? selected.map(dateLabel).join(' · ') : '날짜를 선택하면 여기에 표시됩니다';
  $('#clear-selection').disabled = selected.length === 0;
  $('#year-days').textContent = `${days.length}일`;
  $('#hold-days').textContent = `${days.filter(day => day.status === 'operator-hold-example').length}일`;
  for (const button of calendar.querySelectorAll('[data-date]')) button.setAttribute('aria-pressed', String(selected.includes(button.dataset.date)));
}

function dayButton(day) {
  const choice = selectionFor(days, day.iso, mode), held = day.status === 'operator-hold-example';
  const status = held ? '운영사 홀드 예시' : choice.ok ? '선택 연습 가능' : '3일 구간 선택 불가';
  const label = `${year}년 ${dateLabel(day.iso)} ${weekdays[day.weekday]}요일 · ${status} · ${day.group + 1}번 색상 구간`;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'day-button'; button.dataset.date = day.iso;
  button.dataset.tone = String(day.tone); button.dataset.status = day.status; button.dataset.start = String(day.index % 3 === 0);
  button.dataset.selectable = String(choice.ok);
  button.textContent = String(day.day); button.tabIndex = day.day === 1 ? 0 : -1;
  button.setAttribute('aria-label', label); button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-disabled', String(!choice.ok)); button.title = choice.ok ? label : choice.reason;
  return button;
}

function renderCalendar() {
  calendar.replaceChildren();
  for (const month of calendarMonths(days)) {
    const section = document.createElement('section'), heading = document.createElement('h3'), table = document.createElement('table');
    const number = month[0].month; section.className = 'month-card'; heading.id = `month-${number}`; heading.textContent = `${number}월`; heading.tabIndex = -1;
    heading.dataset.monthSubtitle = `${year}년`;
    section.setAttribute('aria-labelledby', heading.id); table.className = 'month-table'; table.setAttribute('aria-label', `${year}년 ${number}월 일정 선택 연습`);
    const thead = document.createElement('thead'), headRow = document.createElement('tr');
    weekdays.forEach(name => {const th = document.createElement('th'); th.scope = 'col'; th.textContent = name; headRow.append(th);});
    thead.append(headRow); table.append(thead);
    const tbody = document.createElement('tbody'), cells = [...Array(month[0].weekday).fill(null), ...month];
    while (cells.length % 7) cells.push(null);
    for (let offset = 0; offset < cells.length; offset += 7) {
      const row = document.createElement('tr');
      for (const day of cells.slice(offset, offset + 7)) {const td = document.createElement('td'); if (day) td.append(dayButton(day)); row.append(td);}
      tbody.append(row);
    }
    table.append(tbody); section.append(heading, table); calendar.append(section);
  }
}

function refreshPolicy() {
  const domestic = product === 'domestic';
  $('#hold-control').hidden = !domestic;
  modeInputs.find(input => input.value === 'single').disabled = !domestic;
  $('#policy-title').textContent = domestic ? '국내 일정 구성 예시' : '태국 일정 구성 예시 · 홀드 날짜 미정';
  $('#policy-copy').textContent = domestic
    ? `${holdField.checked ? '7월 15일~8월 23일의 금·토요일을 운영사 홀드 예시로 표시합니다' : '운영사 홀드 예시를 해제한 구성입니다'} 40일 범위는 시연용 가정이며 실제 성수기 시작·종료일은 미정입니다 국내 8일 기준과 비연속 이용일 배정의 관계도 확인이 필요합니다`
    : '태국 소개 지역은 푸켓·치앙마이·방콕이며, 도시별 실제 예약 현황을 표시하는 화면은 아닙니다 약 27구좌를 성수기에 보유하는 검토안이 있으나, 성수기 날짜와 구좌별 일정 배정 기준은 미정입니다 27구좌를 81일 등으로 임의 환산하지 않았으며, 이 일정표에는 태국 홀드를 적용하지 않았습니다';
  $('#calendar-title').textContent = `${year}년 연간 일정표 · ${domestic ? '국내' : '태국'}`;
}

function rebuild(notify = true) {
  days = buildYear({year, product, domesticHold: holdField.checked}); selected = [];
  refreshPolicy(); renderCalendar(); renderSummary();
  if (notify) message('설정이 바뀌어 선택 메모를 비웠습니다 실제 예약에는 영향이 없습니다');
}

function focusDate(button) {
  const month = button.closest('.month-card');
  month.querySelectorAll('[data-date]').forEach(day => {day.tabIndex = day === button ? 0 : -1;});
}

calendar.addEventListener('click', event => {
  const button = event.target.closest('[data-date]'); if (!button) return;
  focusDate(button);
  const result = toggleSelection(days, button.dataset.date, mode, selected);
  if (!result.ok) {message(result.reason, true); return;}
  selected = result.selected; renderSummary();
  message(`${result.dates.map(dateLabel).join(' · ')} ${result.action === 'removed' ? '선택 해제' : '선택 메모에 추가'} · 실제 예약이 아닙니다`);
});
calendar.addEventListener('keydown', event => {
  const button = event.target.closest('[data-date]'); if (!button || event.altKey || event.ctrlKey || event.metaKey) return;
  const index = days.findIndex(day => day.iso === button.dataset.date), day = days[index];
  const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -day.weekday, End: 6 - day.weekday};
  if (!(event.key in offsets)) return;
  event.preventDefault();
  const target = days[Math.max(0, Math.min(days.length - 1, index + offsets[event.key]))];
  const next = calendar.querySelector(`[data-date="${target.iso}"]`); focusDate(next); next.focus();
});
productInputs.forEach(input => input.addEventListener('change', () => {
  if (!input.checked) return; product = input.value;
  mode = product === 'thailand' ? 'three' : 'single';
  modeInputs.forEach(item => {item.checked = item.value === mode;});
  rebuild();
}));
modeInputs.forEach(input => input.addEventListener('change', () => {if (input.checked) {mode = input.value; rebuild();}}));
yearField.addEventListener('change', () => {year = Number(yearField.value); rebuild();});
holdField.addEventListener('change', () => rebuild());
$('#clear-selection').addEventListener('click', () => {selected = []; renderSummary(); message('선택 메모를 지웠습니다 실제 예약을 접수하거나 취소하지 않았습니다');});
$('#hide-feedback').addEventListener('click', () => {
  feedback.hidden = true;
  const target = feedbackReturnFocus?.isConnected && !feedbackReturnFocus.disabled && feedbackReturnFocus !== document.body && !feedback.contains(feedbackReturnFocus) ? feedbackReturnFocus : calendar;
  target.focus({preventScroll: true});
});
$('#month-jump').addEventListener('change', event => {
  const heading = $(`#month-${Number(event.target.value)}`);
  if (!heading) return;
  heading.focus({preventScroll: true}); heading.scrollIntoView({block: 'start'});
});
productInputs.forEach(input => {input.checked = input.value === product;});
modeInputs.forEach(input => {input.checked = input.value === mode;});
rebuild(false);
