export interface Patient {
  id: number;
  name: string;
  tokenNumber: number;
  status: "waiting" | "withDoctor";
  startedAt?: number;
}

const QUEUE_KEY = "queue-care-queue";
const TOKEN_KEY = "queue-care-next-token";
const DURATIONS_KEY = "queue-care-durations";
const EVENT_KEY = "queue-update";

function loadQueue(): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: Patient[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

function getNextToken(): number {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? Number(raw) : 1;
}

function incrementToken() {
  localStorage.setItem(TOKEN_KEY, String(getNextToken() + 1));
}

function loadDurations(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DURATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDurations(durations: number[]) {
  localStorage.setItem(DURATIONS_KEY, JSON.stringify(durations));
}

export function getAverageDuration(): number {
  const durations = loadDurations();
  if (durations.length === 0) return 15;
  const total = durations.reduce((sum, d) => sum + d, 0);
  return Math.round(total / durations.length);
}

export function getQueue(): Patient[] {
  return loadQueue();
}

export function addPatient(name: string): Patient {
  const queue = loadQueue();
  const tokenNumber = getNextToken();
  const patient: Patient = {
    id: Date.now(),
    name,
    tokenNumber,
    status: "waiting",
  };
  queue.push(patient);
  incrementToken();
  saveQueue(queue);
  return patient;
}

export function nextPatient(): { movedOut: Patient | null; movedIn: Patient | null } {
  const queue = loadQueue();
  let movedOut: Patient | null = null;
  let movedIn: Patient | null = null;

  const current = queue.find((p) => p.status === "withDoctor");
  if (current) {
    movedOut = current;
    queue.splice(queue.indexOf(current), 1);

    if (current.startedAt) {
      const duration = Math.round((Date.now() - current.startedAt) / 60000);
      const durations = loadDurations();
      durations.push(duration);
      saveDurations(durations.slice(-3));
    }
  }

  const next = queue.find((p) => p.status === "waiting");
  if (next) {
    next.status = "withDoctor";
    next.startedAt = Date.now();
    movedIn = { ...next };
  }

  saveQueue(queue);
  return { movedOut, movedIn };
}

export function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT_KEY, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT_KEY, cb);
    window.removeEventListener("storage", cb);
  };
}
