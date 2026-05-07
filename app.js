// Storage keys
const STORAGE_PEOPLE = 'lsched_people';
const STORAGE_DURATION = 'lsched_slot_duration';
const STORAGE_LAST_SCHEDULE = 'lsched_last_schedule';
const STORAGE_PRESENTER = 'lsched_presenter';

// Initialize storage with defaults
function initStorage() {
  if (!localStorage.getItem(STORAGE_PEOPLE)) {
    localStorage.setItem(STORAGE_PEOPLE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_DURATION)) {
    localStorage.setItem(STORAGE_DURATION, '20');
  }
  if (!localStorage.getItem(STORAGE_PRESENTER)) {
    localStorage.setItem(STORAGE_PRESENTER, '');
  }
}

// People management
function getPeople() {
  const data = localStorage.getItem(STORAGE_PEOPLE);
  return data ? JSON.parse(data) : [];
}

function savePeople(people) {
  localStorage.setItem(STORAGE_PEOPLE, JSON.stringify(people));
}

function addPerson(name) {
  if (!name.trim()) return;
  const people = getPeople();
  people.push({ id: Math.random().toString(36).substr(2, 9), name: name.trim(), duration: 20, included: true });
  savePeople(people);
}

function removePerson(id) {
  const people = getPeople();
  const filtered = people.filter(p => p.id !== id);
  savePeople(filtered);
}

function reorderPeople(newOrder) {
  savePeople(newOrder);
}

// Per-person slot duration
function setPersonDuration(id, minutes) {
  const people = getPeople();
  const person = people.find(p => p.id === id);
  if (person) {
    person.duration = Math.max(5, Math.min(120, minutes));
    savePeople(people);
  }
}

function resetAllDurations() {
  const people = getPeople();
  people.forEach(p => { p.duration = 20; });
  savePeople(people);
}

// Active people selection
function getActivePeople() {
  return getPeople().filter(p => p.included !== false);
}

// Presenter reminder
function getPresenter() {
  return localStorage.getItem(STORAGE_PRESENTER) || '';
}

function setPresenter(name) {
  localStorage.setItem(STORAGE_PRESENTER, name);
}

// Scheduling algorithm
function generateSchedule(startTime, endTime, activePeople, dateStr) {
  if (!startTime || !endTime || activePeople.length === 0) {
    return { error: 'Please set times and select at least one person.' };
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  const totalAvailableMin = endTotalMin - startTotalMin;

  if (totalAvailableMin <= 0) {
    return { error: 'End time must be after start time.' };
  }

  const requiredMin = activePeople.reduce((sum, p) => sum + (p.duration || 20), 0);
  if (requiredMin > totalAvailableMin) {
    return { error: `Not enough time. Need ${requiredMin} min, have ${totalAvailableMin} min.` };
  }

  const slots = [];
  let currentMin = startTotalMin;

  activePeople.forEach(person => {
    const duration = person.duration || 20;
    const start = minToTime(currentMin);
    currentMin += duration;
    const end = minToTime(currentMin);
    slots.push({ personId: person.id, name: person.name, start, end });
  });

  return {
    date: formatDate(dateStr ? new Date(dateStr + 'T12:00:00') : new Date()),
    startTime,
    endTime,
    slots
  };
}

function formatDate(d) {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${weekday} ${dd}/${mm}/${yy}`;
}

function minToTime(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Sharing
function encodeSchedule(schedule) {
  return btoa(JSON.stringify(schedule));
}

function decodeScheduleFromHash() {
  const hash = location.hash;
  if (!hash.startsWith('#data=')) return null;
  try {
    return JSON.parse(atob(hash.slice(6)));
  } catch {
    return null;
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function formatScheduleAsText(schedule) {
  let text = `1-1 Meetings — ${schedule.date}\n\n`;
  schedule.slots.forEach(slot => {
    text += `${slot.start}–${slot.end} — ${slot.name}\n`;
  });
  return text;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStorage);
