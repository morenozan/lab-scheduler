const STORAGE_LAST_SCHEDULE = '1to1_last_schedule';

// timeBlocks: [{start: "09:00", end: "10:30"}, ...]
function generateSchedule(timeBlocks, activePeople, dateStr) {
  if (!timeBlocks || timeBlocks.length === 0 || activePeople.length === 0) {
    return { error: 'Please set times and select at least one person.' };
  }

  const parsedBlocks = [];
  for (const block of timeBlocks) {
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) {
      return { error: 'Each block\'s end time must be after its start time.' };
    }
    parsedBlocks.push({ startMin, endMin, availableMin: endMin - startMin });
  }

  const totalAvailableMin = parsedBlocks.reduce((sum, b) => sum + b.availableMin, 0);
  const requiredMin = activePeople.reduce((sum, p) => sum + (p.duration || 20), 0);
  if (requiredMin > totalAvailableMin) {
    return { error: `Not enough time. Need ${requiredMin} min, have ${totalAvailableMin} min.` };
  }

  const slots = [];
  let blockIdx = 0;
  let currentMin = parsedBlocks[0].startMin;

  for (const person of activePeople) {
    const duration = person.duration || 20;
    while (blockIdx < parsedBlocks.length && currentMin + duration > parsedBlocks[blockIdx].endMin) {
      blockIdx++;
      if (blockIdx < parsedBlocks.length) currentMin = parsedBlocks[blockIdx].startMin;
    }
    if (blockIdx >= parsedBlocks.length) {
      return { error: 'A slot is too long to fit in any remaining block.' };
    }
    const start = minToTime(currentMin);
    currentMin += duration;
    const end = minToTime(currentMin);
    slots.push({ personId: person.id, name: person.name, start, end, blockIndex: blockIdx });
  }

  return {
    date: formatDate(dateStr ? new Date(dateStr + 'T12:00:00') : new Date()),
    blocks: timeBlocks,
    slots
  };
}

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

function formatScheduleAsText(schedule) {
  let text = `1-1 Meetings — ${schedule.date}\n\n`;
  let lastBlockIndex = undefined;
  schedule.slots.forEach(slot => {
    if (slot.blockIndex !== undefined && slot.blockIndex !== lastBlockIndex && lastBlockIndex !== undefined) {
      text += '\n';
    }
    lastBlockIndex = slot.blockIndex;
    text += `${slot.start}–${slot.end} — ${slot.name}\n`;
  });
  return text;
}
