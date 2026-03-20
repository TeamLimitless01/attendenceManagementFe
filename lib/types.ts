// Types for the face attendance system
export interface Student {
  id: string;
  name?: string;
  roll: string;
  descriptor: number[];
  photo: string;
}

export interface LogEntry {
  sid: string;
  name: string;
  roll: string;
  date: string;
  time: string;
  conf: number;
}

export interface Config {
  cls: string;
  subject: string;
  teacher: string;
  date: string;
}

export interface MatchResult {
  student: Student;
  dist: number;
}
