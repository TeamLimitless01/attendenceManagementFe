import type { Student, LogEntry, Config } from './types';

export async function exportExcel(students: Student[], logs: LogEntry[], cfg: Config, today: string) {
  const XLSX = (await import('xlsx')).default;

  const S = (bg: string, bold = false, color = '000000', center = false) => ({
    fill: { fgColor: { rgb: bg } },
    font: { name: 'Arial', bold, color: { rgb: color }, sz: bold ? 11 : 10 },
    alignment: { horizontal: center ? 'center' : 'left', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'DADCE0' } },
      bottom: { style: 'thin', color: { rgb: 'DADCE0' } },
      left: { style: 'thin', color: { rgb: 'DADCE0' } },
      right: { style: 'thin', color: { rgb: 'DADCE0' } },
    },
  });

  const BLUE = '1A73E8', GREEN = '217346', LGRAY = 'F8F9FA', LGRN = 'E6F4EA', LRED = 'FCE8E6', WHITE = 'FFFFFF';
  const present = students.filter(s => logs.find(l => l.sid === s.id && l.date === today)).length;
  const absent = students.length - present;
  const pct = students.length > 0 ? Math.round(present / students.length * 100) + '%' : 'N/A';

  const wb = XLSX.utils.book_new();

  // Sheet 1: Daily Attendance
  const d1: unknown[][] = [];
  d1.push([{ v: 'STUDENT ATTENDANCE REGISTER', s: S(BLUE, true, 'FFFFFF', true) }, '', '', '', '', '', '', '']);
  d1.push([{ v: `Class: ${cfg.cls}`, s: S('E8F0FE', true) }, '', '', '', { v: `Subject: ${cfg.subject}`, s: S('E8F0FE', true) }, '', '', '']);
  d1.push([{ v: `Date: ${today}`, s: S('E8F0FE', true) }, '', '', '', { v: `Teacher: ${cfg.teacher || '—'}`, s: S('E8F0FE', true) }, '', '', '']);
  d1.push(['', '', '', '', '', '', '', '']);
  d1.push(['#', 'Roll No', 'Student Name', 'Status', 'Time Marked', 'Confidence %', 'Date', 'Remarks'].map(h => ({ v: h, s: S(BLUE, true, 'FFFFFF', true) })));

  students.forEach((s, i) => {
    const rec = logs.find(l => l.sid === s.id && l.date === today);
    const bg = i % 2 === 0 ? LGRAY : WHITE;
    d1.push([
      { v: i + 1, s: S(bg, false, '444444', true) },
      { v: s.roll, s: S(bg, false, '444444', true) },
      { v: s.name, s: S(bg, false, '222222', false) },
      { v: rec ? 'Present' : 'Absent', s: S(rec ? LGRN : LRED, true, rec ? '1E8E3E' : 'D93025', true) },
      { v: rec ? rec.time : '—', s: S(bg, false, '666666', true) },
      { v: rec ? rec.conf + '%' : '—', s: S(bg, false, rec ? '1E8E3E' : '999999', true) },
      { v: today, s: S(bg, false, '666666', true) },
      { v: '', s: S(bg) },
    ]);
  });

  d1.push(['', '', '', '', '', '', '', '']);
  d1.push([
    { v: 'SUMMARY', s: S(BLUE, true, 'FFFFFF', true) },
    { v: 'Total', s: S('E8F0FE', true) },
    { v: students.length, s: S('E8F0FE', true, '1A73E8', true) },
    { v: 'Present', s: S(LGRN, true) },
    { v: present, s: S(LGRN, true, '1E8E3E', true) },
    { v: 'Absent', s: S(LRED, true) },
    { v: absent, s: S(LRED, true, 'D93025', true) },
    { v: 'Attendance: ' + pct, s: S('FFF3E0', true, 'E37400', true) },
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(d1);
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 1, c: 4 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 4 }, e: { r: 2, c: 7 } },
  ];
  ws1['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Daily Attendance');

  // Sheet 2: All Records
  const allDates = [...new Set(logs.map(l => l.date))].sort().reverse();
  const d2: unknown[][] = [];
  d2.push([{ v: 'COMPLETE ATTENDANCE RECORDS', s: S(GREEN, true, 'FFFFFF', true) }, '', '', '', '', '', '', '']);
  d2.push(['#', 'Roll No', 'Student Name', 'Status', 'Time', 'Confidence %', 'Date', 'Day'].map(h => ({ v: h, s: S(GREEN, true, 'FFFFFF', true) })));
  let ri = 0;

  if (allDates.length === 0) {
    students.forEach((s, i) => {
      const bg = i % 2 === 0 ? LGRAY : WHITE;
      d2.push([
        { v: i + 1, s: S(bg, false, '444444', true) },
        { v: s.roll, s: S(bg, false, '444444', true) },
        { v: s.name, s: S(bg, false, '222222') },
        { v: 'Absent', s: S(LRED, true, 'D93025', true) },
        { v: '—', s: S(bg, false, '999999', true) },
        { v: '—', s: S(bg, false, '999999', true) },
        { v: today, s: S(bg, false, '444444', true) },
        { v: new Date(today).toLocaleDateString('en-US', { weekday: 'long' }), s: S(bg, false, '666666', true) },
      ]);
    });
  } else {
    allDates.forEach(date => {
      students.forEach(s => {
        const rec = logs.find(l => l.sid === s.id && l.date === date);
        const bg = ri % 2 === 0 ? LGRAY : WHITE;
        d2.push([
          { v: ri + 1, s: S(bg, false, '444444', true) },
          { v: s.roll, s: S(bg, false, '444444', true) },
          { v: s.name, s: S(bg, false, '222222') },
          { v: rec ? 'Present' : 'Absent', s: S(rec ? LGRN : LRED, true, rec ? '1E8E3E' : 'D93025', true) },
          { v: rec ? rec.time : '—', s: S(bg, false, '666666', true) },
          { v: rec ? rec.conf + '%' : '—', s: S(bg, false, rec ? '1E8E3E' : '999999', true) },
          { v: date, s: S(bg, false, '444444', true) },
          { v: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }), s: S(bg, false, '666666', true) },
        ]);
        ri++;
      });
    });
  }

  const ws2 = XLSX.utils.aoa_to_sheet(d2);
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
  ws2['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'All Records');

  // Sheet 3: Summary
  const d3: unknown[][] = [
    [{ v: 'ATTENDANCE SUMMARY', s: S(BLUE, true, 'FFFFFF', true) }, '', '', ''],
    [{ v: 'Generated:', s: S('F8F9FA', true) }, { v: new Date().toLocaleString(), s: S('F8F9FA') }, '', ''],
    [' ', '', '', ''],
    [{ v: 'Class', s: S('F8F9FA', true) }, { v: cfg.cls, s: S(WHITE) }, '', ''],
    [{ v: 'Subject', s: S('F8F9FA', true) }, { v: cfg.subject, s: S(WHITE) }, '', ''],
    [{ v: 'Teacher', s: S('F8F9FA', true) }, { v: cfg.teacher || '—', s: S(WHITE) }, '', ''],
    [{ v: 'Date', s: S('F8F9FA', true) }, { v: today, s: S(WHITE) }, '', ''],
    [' ', '', '', ''],
    [{ v: 'Total Students', s: S('F8F9FA', true) }, { v: students.length, s: S(WHITE, true, '1A73E8', true) }, '', ''],
    [{ v: 'Present Today', s: S(LGRN, true) }, { v: present, s: S(LGRN, true, '1E8E3E', true) }, '', ''],
    [{ v: 'Absent Today', s: S(LRED, true) }, { v: absent, s: S(LRED, true, 'D93025', true) }, '', ''],
    [{ v: 'Attendance %', s: S('FFF3E0', true) }, { v: pct, s: S('FFF3E0', true, 'E37400', true) }, '', ''],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(d3);
  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  ws3['!cols'] = [{ wch: 20 }, { wch: 24 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

  XLSX.writeFile(wb, `Attendance_${cfg.cls}_${today}.xlsx`.replace(/\s/g, '_'));
}

export function exportCSV(students: Student[], logs: LogEntry[], cfg: Config, today: string) {
  const rows = [['Roll No', 'Name', 'Date', 'Status', 'Time', 'Confidence %']];
  students.forEach(s => {
    const r = logs.find(l => l.sid === s.id && l.date === today);
    rows.push([s.roll, s.name, today, r ? 'Present' : 'Absent', r ? r.time : '', r ? String(r.conf) : '']);
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
  a.download = `Attendance_${cfg.cls}_${today}.csv`.replace(/\s/g, '_');
  a.click();
}
