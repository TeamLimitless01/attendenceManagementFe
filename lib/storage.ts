import type { Student, LogEntry, Config } from './types';

const STUDENTS_KEY = 'fa_students';
const LOGS_KEY = 'fa_logs';
const CFG_KEY = 'fa_cfg';

export function loadStudents(): Student[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function loadLogs(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
}

export function saveLogs(logs: LogEntry[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function loadConfig(): Config {
  if (typeof window === 'undefined') {
    return { cls: 'Class 10-A', subject: 'Mathematics', teacher: '', date: '' };
  }
  return JSON.parse(localStorage.getItem(CFG_KEY) || 'null') || {
    cls: 'Class 10-A',
    subject: 'Mathematics',
    teacher: '',
    date: '',
  };
}

export function saveConfig(cfg: Config): void {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}
