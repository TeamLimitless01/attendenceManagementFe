import { strapi } from './sdk/sdk';
import type { Student, LogEntry, Config } from './types';

const STUDENTS_KEY = 'fa_students';
const LOGS_KEY = 'fa_logs';
const CFG_KEY = 'fa_cfg';

export function loadStudents(): Student[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
}

export async function saveStudents(students: Student[]): Promise<void> {
  try {
    if (!students || students.length === 0) return;
    const studentItem = students[0];
    const targetKey = studentItem.id || studentItem.roll || (studentItem as any).roll_number || (studentItem as any).documentId;

    if (!targetKey) {
      console.warn('saveStudents skipped: missing student identifier', studentItem);
      return;
    }

    const res = await strapi.update("students", targetKey, {
      faceEmbedding: studentItem.descriptor,
      photo: studentItem.photo,
    });

    if (!res) {
      throw new Error('Failed to save students');
    }
  } catch (error) {
    console.error('Error saving students:', error);
  }
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
