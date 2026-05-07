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
  people.push({ id: Math.random().toString(36).substr(2, 9), name: name.trim() });
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

// Slot duration
function getSlotDuration() {
  const val = localStorage.getItem(STORAGE_DURATION);
  return val ? parseInt(val, 10) : 20;
}

function setSlotDuration(minutes) {
  localStorage.setItem(STORAGE_DURATION, String(Math.max(5, Math.min(120, minutes))));
}

function resetSlotDuration() {
  setSlotDuration(20);
}

// Presenter reminder
function getPresenter() {
  return localStorage.getItem(STORAGE_PRESENTER) || '';
}

function setPresenter(name) {
  localStorage.setItem(STORAGE_PRESENTER, name);
}

// Scheduling algorithm
function generateSchedule(startTime, endTime, activePeople, slotDuration) {
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

  const requiredMin = activePeople.length * slotDuration;
  if (requiredMin > totalAvailableMin) {
    return { error: `Not enough time. Need ${requiredMin} min, have ${totalAvailableMin} min.` };
  }

  const slots = [];
  let currentMin = startTotalMin;

  activePeople.forEach(person => {
    const start = minToTime(currentMin);
    currentMin += slotDuration;
    const end = minToTime(currentMin);
    slots.push({ personId: person.id, name: person.name, start, end });
  });

  return {
    date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    startTime,
    endTime,
    slots
  };
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
  let text = `Lab Schedule — ${schedule.date}\n`;
  text += `${schedule.startTime}–${schedule.endTime}\n\n`;
  schedule.slots.forEach(slot => {
    text += `${slot.start}–${slot.end} — ${slot.name}\n`;
  });
  return text;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initStorage);
