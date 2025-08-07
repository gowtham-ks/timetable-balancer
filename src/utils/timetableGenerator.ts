import { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings, 
  ClassTimetable, 
  TeacherTimetable, 
  TimeSlot, 
  SubjectAllocation 
} from '@/types/timetable';

export class TimetableGenerator {
  private subjectData: SubjectData[] = [];
  private teacherPreferences: TeacherPreference[] = [];
  private scheduleSettings: ScheduleSettings;
  private subjectAllocations: Map<string, SubjectAllocation> = new Map();
  private teacherWorkload: Map<string, number> = new Map();
  private classTimetables: Map<string, TimeSlot[][]> = new Map();
  private teacherTimetables: Map<string, TimeSlot[][]> = new Map();

  constructor(
    subjectData: SubjectData[],
    teacherPreferences: TeacherPreference[],
    scheduleSettings: ScheduleSettings
  ) {
    this.subjectData = subjectData;
    this.teacherPreferences = teacherPreferences;
    this.scheduleSettings = scheduleSettings;
    this.initializeDataStructures();
  }

  private initializeDataStructures() {
    // Initialize subject allocations
    this.subjectData.forEach(data => {
      const className = `${data.department}-${data.year}-${data.section}`;
      const subjectKey = `${data.subject}-${className}`;
      
      this.subjectAllocations.set(subjectKey, {
        subjectKey,
        allocatedPeriods: 0,
        requiredPeriods: data.periods
      });
    });

    // Initialize teacher workload
    this.subjectData.forEach(data => {
      this.teacherWorkload.set(data.staff, 0);
    });

    // Initialize empty timetables
    const uniqueClasses = [...new Set(this.subjectData.map(data => 
      `${data.department}-${data.year}-${data.section}`
    ))];

    const uniqueTeachers = [...new Set(this.subjectData.map(data => data.staff))];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    uniqueClasses.forEach(className => {
      const schedule: TimeSlot[][] = days.map(day => 
        Array(this.scheduleSettings.totalPeriodsPerDay).fill(null).map((_, period) => ({
          day,
          period: period + 1
        }))
      );
      this.classTimetables.set(className, schedule);
    });

    uniqueTeachers.forEach(teacher => {
      const schedule: TimeSlot[][] = days.map(day => 
        Array(this.scheduleSettings.totalPeriodsPerDay).fill(null).map((_, period) => ({
          day,
          period: period + 1
        }))
      );
      this.teacherTimetables.set(teacher, schedule);
    });
  }

  public generateTimetables(): { 
    classTimetables: ClassTimetable[], 
    teacherTimetables: TeacherTimetable[] 
  } {
    // Sort subjects by priority (fewer periods first for better distribution)
    const sortedSubjects = [...this.subjectData].sort((a, b) => a.periods - b.periods);

    // Allocate subjects
    sortedSubjects.forEach(subjectData => {
      this.allocateSubject(subjectData);
    });

    return {
      classTimetables: this.getClassTimetables(),
      teacherTimetables: this.getTeacherTimetables()
    };
  }

  private allocateSubject(subjectData: SubjectData) {
    const className = `${subjectData.department}-${subjectData.year}-${subjectData.section}`;
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey);
    
    if (!allocation) return;

    const classSchedule = this.classTimetables.get(className);
    const teacherSchedule = this.teacherTimetables.get(subjectData.staff);
    
    if (!classSchedule || !teacherSchedule) return;

    // Try to allocate remaining periods
    const remainingPeriods = allocation.requiredPeriods - allocation.allocatedPeriods;
    
    for (let periodsToAllocate = 0; periodsToAllocate < remainingPeriods; periodsToAllocate++) {
      const slot = this.findBestSlot(subjectData, className);
      
      if (slot) {
        this.assignSlot(slot, subjectData, className);
        allocation.allocatedPeriods++;
        
        // Update teacher workload
        const currentWorkload = this.teacherWorkload.get(subjectData.staff) || 0;
        this.teacherWorkload.set(subjectData.staff, currentWorkload + 1);
      } else {
        console.warn(`Could not allocate all periods for ${subjectData.subject} in ${className}. 
          Allocated: ${allocation.allocatedPeriods}, Required: ${allocation.requiredPeriods}`);
        break;
      }
    }
  }

  private findBestSlot(subjectData: SubjectData, className: string): { day: number, period: number } | null {
    const classSchedule = this.classTimetables.get(className);
    const teacherSchedule = this.teacherTimetables.get(subjectData.staff);
    
    if (!classSchedule || !teacherSchedule) return null;

    const teacherPreference = this.teacherPreferences.find(
      pref => pref.teacherName === subjectData.staff
    );

    // Check if teacher has exceeded max periods per week
    const currentWorkload = this.teacherWorkload.get(subjectData.staff) || 0;
    if (currentWorkload >= this.scheduleSettings.maxTeacherPeriodsPerWeek) {
      return null;
    }

    // Try preferred slots first
    if (subjectData.preferredDay && subjectData.preferredPeriod) {
      const dayIndex = this.getDayIndex(subjectData.preferredDay);
      const period = subjectData.preferredPeriod - 1;
      
      if (dayIndex !== -1 && this.isSlotAvailable(dayIndex, period, className, subjectData.staff)) {
        return { day: dayIndex, period };
      }
    }

    if (teacherPreference) {
      const dayIndex = this.getDayIndex(teacherPreference.preferredDay);
      const period = teacherPreference.preferredPeriod - 1;
      
      if (dayIndex !== -1 && this.isSlotAvailable(dayIndex, period, className, subjectData.staff)) {
        return { day: dayIndex, period };
      }
    }

    // Find any available slot
    for (let day = 0; day < 6; day++) {
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) {
          continue;
        }

        if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
          return { day, period };
        }
      }
    }

    return null;
  }

  private isSlotAvailable(day: number, period: number, className: string, teacher: string): boolean {
    const classSchedule = this.classTimetables.get(className);
    const teacherSchedule = this.teacherTimetables.get(teacher);
    
    if (!classSchedule || !teacherSchedule) return false;

    // Check if class slot is free
    const classSlot = classSchedule[day][period];
    if (classSlot.subject) return false;

    // Check if teacher slot is free
    const teacherSlot = teacherSchedule[day][period];
    if (teacherSlot.subject) return false;

    return true;
  }

  private assignSlot(slot: { day: number, period: number }, subjectData: SubjectData, className: string) {
    const classSchedule = this.classTimetables.get(className);
    const teacherSchedule = this.teacherTimetables.get(subjectData.staff);
    
    if (!classSchedule || !teacherSchedule) return;

    const timeSlot: TimeSlot = {
      day: this.getDayName(slot.day),
      period: slot.period + 1,
      subject: subjectData.subject,
      staff: subjectData.staff,
      className
    };

    // Assign to class timetable
    classSchedule[slot.day][slot.period] = { ...timeSlot };

    // Assign to teacher timetable
    teacherSchedule[slot.day][slot.period] = { ...timeSlot };
  }

  private getDayIndex(dayName: string): number {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(dayName.toLowerCase());
  }

  private getDayName(dayIndex: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  private getClassTimetables(): ClassTimetable[] {
    const result: ClassTimetable[] = [];
    
    this.classTimetables.forEach((schedule, className) => {
      result.push({
        className,
        schedule
      });
    });

    return result.sort((a, b) => a.className.localeCompare(b.className));
  }

  private getTeacherTimetables(): TeacherTimetable[] {
    const result: TeacherTimetable[] = [];
    
    this.teacherTimetables.forEach((schedule, teacherName) => {
      result.push({
        teacherName,
        schedule
      });
    });

    return result.sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }

  public getSubjectAllocationReport(): SubjectAllocation[] {
    return Array.from(this.subjectAllocations.values());
  }
}