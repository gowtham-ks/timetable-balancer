import { ClassTimetable, TeacherTimetable } from '@/types/timetable';

export function exportToCSV(classTimetables: ClassTimetable[], teacherTimetables: TeacherTimetable[]) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Class timetables CSV
  let classCSV = 'Type,Name,Day,Period,Subject,Staff\n';
  classTimetables.forEach(classData => {
    classData.schedule.forEach((daySchedule, dayIndex) => {
      daySchedule.forEach((slot, periodIndex) => {
        if (slot.subject) {
          classCSV += `Class,${classData.className},${days[dayIndex]},${periodIndex + 1},${slot.subject},${slot.staff}\n`;
        }
      });
    });
  });

  // Teacher timetables CSV
  let teacherCSV = 'Type,Name,Day,Period,Subject,Class\n';
  teacherTimetables.forEach(teacherData => {
    teacherData.schedule.forEach((daySchedule, dayIndex) => {
      daySchedule.forEach((slot, periodIndex) => {
        if (slot.subject) {
          teacherCSV += `Teacher,${teacherData.teacherName},${days[dayIndex]},${periodIndex + 1},${slot.subject},${slot.className}\n`;
        }
      });
    });
  });

  return { classCSV, teacherCSV };
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToExcel(classTimetables: ClassTimetable[], teacherTimetables: TeacherTimetable[]) {
  // Convert to CSV format and download as Excel-compatible file
  const { classCSV, teacherCSV } = exportToCSV(classTimetables, teacherTimetables);
  
  // Combine both in one file with headers
  const combinedCSV = 'CLASS TIMETABLES\n' + classCSV + '\n\nTEACHER TIMETABLES\n' + teacherCSV;
  
  downloadCSV(combinedCSV, 'timetables.csv');
}

export function printTimetables() {
  window.print();
}