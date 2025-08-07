export interface SubjectData {
  department: string;
  year: string;
  section: string;
  subject: string;
  periods: number;
  staff: string;
  preferredDay?: string;
  preferredPeriod?: number;
  preferredSlots?: string;
}

export interface TeacherPreference {
  teacherName: string;
  preferredDay: string;
  preferredPeriod: number;
}

export interface ScheduleSettings {
  totalPeriodsPerDay: number;
  lunchPeriod: number;
  breakPeriods: number[];
  maxTeacherPeriodsPerWeek: number;
}

export interface TimeSlot {
  day: string;
  period: number;
  subject?: string;
  staff?: string;
  className?: string;
}

export interface ClassTimetable {
  className: string;
  schedule: TimeSlot[][];
}

export interface TeacherTimetable {
  teacherName: string;
  schedule: TimeSlot[][];
}

export interface SubjectAllocation {
  subjectKey: string; // `${subject}-${className}`
  allocatedPeriods: number;
  requiredPeriods: number;
}

export interface TimetableState {
  subjectData: SubjectData[];
  teacherPreferences: TeacherPreference[];
  scheduleSettings: ScheduleSettings;
  classTimetables: ClassTimetable[];
  teacherTimetables: TeacherTimetable[];
  subjectAllocations: Map<string, SubjectAllocation>;
}