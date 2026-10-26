/**
 * BUPGO - Universal Interactive Calendar & Clock Controllers
 * Works seamlessly across mobile & desktop with light/dark theme support.
 */

// Month Names & Days
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* =========================================================
   1. UNIVERSAL CALENDAR PICKER
   ========================================================= */

let calCurrentDate = new Date();
let calSelectedDate = new Date();
let calActiveInput = null;
let calModalEl = null;

function openUniversalCalendar(inputOrId) {
  const inputEl = typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
  if (!inputEl) return;

  calActiveInput = inputEl;

  // If input already has a value, parse it
  if (inputEl.value) {
    const parsed = new Date(inputEl.value);
    if (!isNaN(parsed.getTime())) {
      calSelectedDate = parsed;
      calCurrentDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
  } else {
    calSelectedDate = new Date();
    calCurrentDate = new Date();
  }

  renderCalendarModal();
}

function renderCalendarModal() {
  if (calModalEl) {
    calModalEl.remove();
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'bupgo-calendar-modal-backdrop';
  backdrop.id = 'bupgo-calendar-modal';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create day cells
  let dayCellsHtml = '';

  // Empty cells before month starts
  for (let i = 0; i < firstDayIndex; i++) {
    dayCellsHtml += `<div class="cal-day-cell empty"></div>`;
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);

    const isPast = cellDate < today;
    const isToday = cellDate.getTime() === today.getTime();
    const isSelected = calSelectedDate &&
      cellDate.getFullYear() === calSelectedDate.getFullYear() &&
      cellDate.getMonth() === calSelectedDate.getMonth() &&
      cellDate.getDate() === calSelectedDate.getDate();

    let classes = 'cal-day-cell';
    if (isPast) classes += ' disabled';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';

    dayCellsHtml += `
      <div class="${classes}" data-day="${d}" ${isPast ? '' : `onclick="selectCalendarDay(${d})"`}>
        ${d}
      </div>
    `;
  }

  backdrop.innerHTML = `
    <div class="bupgo-calendar-card" onclick="event.stopPropagation()">
      <div class="cal-card-header">
        <div class="cal-header-title">
          <h4>📅 Calendar</h4>
          <div class="cal-header-sub">Select pickup / departure date</div>
        </div>
        <button class="cal-close-btn" onclick="closeUniversalCalendar()">&times;</button>
      </div>

      <!-- Quick Date Shortcuts -->
      <div class="cal-shortcuts">
        <button class="cal-shortcut-pill" onclick="pickCalendarShortcut(0)">Today</button>
        <button class="cal-shortcut-pill" onclick="pickCalendarShortcut(1)">Tomorrow</button>
        <button class="cal-shortcut-pill" onclick="pickCalendarShortcut(2)">In 2 Days</button>
        <button class="cal-shortcut-pill" onclick="pickCalendarShortcut(3)">In 3 Days</button>
        <button class="cal-shortcut-pill" onclick="clearCalendarDate()">Clear Filter</button>
      </div>

      <div class="cal-body">
        <div class="cal-month-nav">
          <button class="cal-nav-btn" onclick="prevCalendarMonth()">&lt;</button>
          <div class="cal-month-title">${MONTH_NAMES[month]} ${year}</div>
          <button class="cal-nav-btn" onclick="nextCalendarMonth()">&gt;</button>
        </div>

        <div class="cal-weekdays">
          ${WEEKDAY_NAMES.map(w => `<div>${w}</div>`).join('')}
        </div>

        <div class="cal-days-grid">
          ${dayCellsHtml}
        </div>
      </div>

      <div class="cal-footer">
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          Selected: <strong style="color: var(--bup-primary);">${formatDateDisplay(calSelectedDate)}</strong>
        </span>
        <button class="btn btn-primary btn-sm" onclick="confirmCalendarSelection()">Confirm Date</button>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeUniversalCalendar);
  document.body.appendChild(backdrop);
  calModalEl = backdrop;
}

function formatDateDisplay(d) {
  if (!d) return 'None';
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

function formatIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prevCalendarMonth() {
  calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
  renderCalendarModal();
}

function nextCalendarMonth() {
  calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
  renderCalendarModal();
}

function selectCalendarDay(day) {
  calSelectedDate = new Date(calCurrentDate.getFullYear(), calCurrentDate.getMonth(), day);
  renderCalendarModal();
}

function pickCalendarShortcut(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  calSelectedDate = d;
  calCurrentDate = new Date(d.getFullYear(), d.getMonth(), 1);
  confirmCalendarSelection();
}

function clearCalendarDate() {
  if (calActiveInput) {
    calActiveInput.value = '';
    calActiveInput.dispatchEvent(new Event('change', { bubbles: true }));
    calActiveInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  closeUniversalCalendar();
}

function confirmCalendarSelection() {
  if (calActiveInput && calSelectedDate) {
    calActiveInput.value = formatIsoDate(calSelectedDate);
    calActiveInput.dispatchEvent(new Event('change', { bubbles: true }));
    calActiveInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  closeUniversalCalendar();
}

function closeUniversalCalendar() {
  if (calModalEl) {
    calModalEl.remove();
    calModalEl = null;
  }
}


/* =========================================================
   2. UNIVERSAL CLOCK PICKER
   ========================================================= */

let clockActiveInput = null;
let clockModalEl = null;
let clockHour = '08';
let clockMinute = '00';
let clockAmPm = 'AM';

function openUniversalClock(inputOrId) {
  const inputEl = typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
  if (!inputEl) return;

  clockActiveInput = inputEl;

  // Parse existing time value if present (e.g. "08:30 AM" or "16:45")
  if (inputEl.value) {
    parseTimeValue(inputEl.value);
  } else {
    // Default to nearest morning class time
    clockHour = '08';
    clockMinute = '00';
    clockAmPm = 'AM';
  }

  renderClockModal();
}

function parseTimeValue(str) {
  const val = str.trim();
  const match12 = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const ampm = (match12[3] || 'AM').toUpperCase();
    if (h > 12) {
      h -= 12;
      clockAmPm = 'PM';
    } else {
      clockAmPm = ampm;
    }
    clockHour = String(h).padStart(2, '0');
    clockMinute = m;
    return;
  }

  // Fallback
  clockHour = '08';
  clockMinute = '00';
  clockAmPm = 'AM';
}

function renderClockModal() {
  if (clockModalEl) {
    clockModalEl.remove();
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'bupgo-clock-modal-backdrop';
  backdrop.id = 'bupgo-clock-modal';

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  backdrop.innerHTML = `
    <div class="bupgo-clock-card" onclick="event.stopPropagation()">
      <div class="clock-card-header">
        <div class="clock-header-title">
          <h4>⏰ Universal Clock</h4>
          <div class="clock-header-sub">Pick departure & commute time</div>
        </div>
        <button class="clock-close-btn" onclick="closeUniversalClock()">&times;</button>
      </div>

      <!-- Quick Commute Presets -->
      <div class="clock-presets">
        <button class="clock-preset-pill" onclick="setClockPreset('07', '30', 'AM')">07:30 AM (BUP Early)</button>
        <button class="clock-preset-pill" onclick="setClockPreset('08', '00', 'AM')">08:00 AM (Class Start)</button>
        <button class="clock-preset-pill" onclick="setClockPreset('01', '30', 'PM')">01:30 PM (Midday)</button>
        <button class="clock-preset-pill" onclick="setClockPreset('04', '30', 'PM')">04:30 PM (Return Trip)</button>
        <button class="clock-preset-pill" onclick="setClockPreset('05', '15', 'PM')">05:15 PM (Evening)</button>
      </div>

      <div class="clock-dial-container">
        <!-- Big Digital Display -->
        <div class="clock-digital-display">
          <div class="clock-digits-box">
            <span id="disp-clock-hour">${clockHour}</span>:<span id="disp-clock-min">${clockMinute}</span>
          </div>
          <div class="clock-ampm-switch">
            <button class="clock-ampm-btn ${clockAmPm === 'AM' ? 'active' : ''}" onclick="setClockAmPm('AM')">AM</button>
            <button class="clock-ampm-btn ${clockAmPm === 'PM' ? 'active' : ''}" onclick="setClockAmPm('PM')">PM</button>
          </div>
        </div>

        <!-- Wheel Selectors -->
        <div class="clock-selectors-row">
          <div class="clock-col-picker">
            <div class="clock-col-label">Hour (1-12)</div>
            <div class="clock-scroll-box">
              ${hoursList.map(h => `
                <div class="clock-time-item ${h === clockHour ? 'selected' : ''}" onclick="selectClockHour('${h}')">
                  ${h}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="clock-col-picker">
            <div class="clock-col-label">Minute (00-55)</div>
            <div class="clock-scroll-box">
              ${minutesList.map(m => `
                <div class="clock-time-item ${m === clockMinute ? 'selected' : ''}" onclick="selectClockMinute('${m}')">
                  :${m}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="clock-footer">
        <span style="font-size: 0.82rem; color: var(--text-muted);">
          Selected Time: <strong style="color: var(--bup-primary); font-size: 0.95rem;">${clockHour}:${clockMinute} ${clockAmPm}</strong>
        </span>
        <button class="btn btn-primary btn-sm" onclick="confirmClockSelection()">Set Time</button>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeUniversalClock);
  document.body.appendChild(backdrop);
  clockModalEl = backdrop;
}

function selectClockHour(h) {
  clockHour = h;
  renderClockModal();
}

function selectClockMinute(m) {
  clockMinute = m;
  renderClockModal();
}

function setClockAmPm(ampm) {
  clockAmPm = ampm;
  renderClockModal();
}

function setClockPreset(h, m, ampm) {
  clockHour = h;
  clockMinute = m;
  clockAmPm = ampm;
  confirmClockSelection();
}

function confirmClockSelection() {
  if (clockActiveInput) {
    const timeStr = `${clockHour}:${clockMinute} ${clockAmPm}`;
    clockActiveInput.value = timeStr;
    clockActiveInput.dispatchEvent(new Event('change', { bubbles: true }));
    clockActiveInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  closeUniversalClock();
}

function closeUniversalClock() {
  if (clockModalEl) {
    clockModalEl.remove();
    clockModalEl = null;
  }
}

/**
 * Auto-hooks Universal Calendar & Clock to inputs
 */
function initDateTimePickers() {
  // Date inputs
  const dateInputIds = ['search-date', 'filter-date', 'offer-date'];
  dateInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.hasCalPicker) {
      el.dataset.hasCalPicker = 'true';
      el.style.cursor = 'pointer';

      // Attach click to open universal calendar
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openUniversalCalendar(el);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openUniversalCalendar(el);
        }
      });
    }
  });

  // Time inputs
  const timeInputIds = ['offer-time', 'search-time', 'filter-time'];
  timeInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.hasClockPicker) {
      el.dataset.hasClockPicker = 'true';
      el.style.cursor = 'pointer';

      el.addEventListener('click', (e) => {
        e.preventDefault();
        openUniversalClock(el);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openUniversalClock(el);
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDateTimePickers();
});
