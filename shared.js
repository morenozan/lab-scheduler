// Storage keys
const STORAGE_PEOPLE = 'lab_people';
const STORAGE_PRESENTER = '1to1_presenter';

function initStorage() {
  // One-time migration: rename 1to1_people → lab_people
  const OLD_KEY = '1to1_people';
  const old = localStorage.getItem(OLD_KEY);
  if (old !== null && localStorage.getItem(STORAGE_PEOPLE) === null) {
    localStorage.setItem(STORAGE_PEOPLE, old);
    localStorage.removeItem(OLD_KEY);
  }
  localStorage.removeItem('1to1_slot_duration');

  if (!localStorage.getItem(STORAGE_PEOPLE)) {
    localStorage.setItem(STORAGE_PEOPLE, JSON.stringify([]));
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
  savePeople(people.filter(p => p.id !== id));
}

function reorderPeople(newOrder) {
  savePeople(newOrder);
}

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

// Date/time utilities
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

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', initStorage);
