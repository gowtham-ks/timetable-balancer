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
    // Reset all allocations
    this.resetAllocations();

    // Multiple passes to ensure all subjects get allocated
    let maxAttempts = 5;
    let attempt = 0;
    
    while (attempt < maxAttempts && !this.isAllocationComplete()) {
      console.log(`Allocation attempt ${attempt + 1}/${maxAttempts}`);
      
      // Sort subjects by priority - harder to place subjects first
      const sortedSubjects = this.getSortedSubjects();
      
      // Try to allocate each subject
      for (const subjectData of sortedSubjects) {
        this.allocateSubjectCompletely(subjectData);
      }
      
      attempt++;
    }

    // Report any unallocated periods
    this.reportAllocationStatus();

    return {
      classTimetables: this.getClassTimetables(),
      teacherTimetables: this.getTeacherTimetables()
    };
  }

  private resetAllocations() {
    // Reset subject allocations to 0
    this.subjectAllocations.forEach(allocation => {
      allocation.allocatedPeriods = 0;
    });

    // Reset teacher workload
    this.teacherWorkload.clear();
    this.subjectData.forEach(data => {
      this.teacherWorkload.set(data.staff, 0);
    });

    // Clear all timetables
    this.classTimetables.forEach(schedule => {
      schedule.forEach(daySchedule => {
        daySchedule.forEach(slot => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
        });
      });
    });

    this.teacherTimetables.forEach(schedule => {
      schedule.forEach(daySchedule => {
        daySchedule.forEach(slot => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
        });
      });
    });
  }

  private getSortedSubjects(): SubjectData[] {
    // Sort by multiple criteria for better allocation
    return [...this.subjectData].sort((a, b) => {
      // First by remaining periods (descending) - allocate high-period subjects first
      const aRemaining = this.getRemainingPeriods(a);
      const bRemaining = this.getRemainingPeriods(b);
      if (aRemaining !== bRemaining) {
        return bRemaining - aRemaining;
      }
      
      // Then by teacher workload (ascending) - give priority to less busy teachers
      const aWorkload = this.teacherWorkload.get(a.staff) || 0;
      const bWorkload = this.teacherWorkload.get(b.staff) || 0;
      if (aWorkload !== bWorkload) {
        return aWorkload - bWorkload;
      }
      
      // Finally by subject name for consistency
      return a.subject.localeCompare(b.subject);
    });
  }

  private getRemainingPeriods(subjectData: SubjectData): number {
    const className = `${subjectData.department}-${subjectData.year}-${subjectData.section}`;
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey);
    return allocation ? allocation.requiredPeriods - allocation.allocatedPeriods : 0;
  }

  private isAllocationComplete(): boolean {
    for (const allocation of this.subjectAllocations.values()) {
      if (allocation.allocatedPeriods < allocation.requiredPeriods) {
        return false;
      }
    }
    return true;
  }

  private allocateSubjectCompletely(subjectData: SubjectData) {
    const className = `${subjectData.department}-${subjectData.year}-${subjectData.section}`;
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey);
    
    if (!allocation) return;

    // Try to allocate all remaining periods for this subject
    while (allocation.allocatedPeriods < allocation.requiredPeriods) {
      const slot = this.findBestSlot(subjectData, className);
      
      if (slot) {
        this.assignSlot(slot, subjectData, className);
        allocation.allocatedPeriods++;
        
        // Update teacher workload
        const currentWorkload = this.teacherWorkload.get(subjectData.staff) || 0;
        this.teacherWorkload.set(subjectData.staff, currentWorkload + 1);
      } else {
        // If we can't find a slot, try relaxing constraints
        const relaxedSlot = this.findSlotWithRelaxedConstraints(subjectData, className);
        if (relaxedSlot) {
          this.assignSlot(relaxedSlot, subjectData, className);
          allocation.allocatedPeriods++;
          
          const currentWorkload = this.teacherWorkload.get(subjectData.staff) || 0;
          this.teacherWorkload.set(subjectData.staff, currentWorkload + 1);
        } else {
          // Can't allocate this period, log and break
          console.warn(`Could not allocate period for ${subjectData.subject} in ${className}. 
            Allocated: ${allocation.allocatedPeriods}/${allocation.requiredPeriods}`);
          break;
        }
      }
    }
  }

  private reportAllocationStatus() {
    console.log('\n=== ALLOCATION REPORT ===');
    let totalRequired = 0;
    let totalAllocated = 0;
    let unallocatedSubjects: string[] = [];

    this.subjectAllocations.forEach((allocation, subjectKey) => {
      totalRequired += allocation.requiredPeriods;
      totalAllocated += allocation.allocatedPeriods;
      
      if (allocation.allocatedPeriods < allocation.requiredPeriods) {
        const shortfall = allocation.requiredPeriods - allocation.allocatedPeriods;
        unallocatedSubjects.push(`${subjectKey}: ${shortfall} periods short`);
      }
    });

    console.log(`Total periods required: ${totalRequired}`);
    console.log(`Total periods allocated: ${totalAllocated}`);
    console.log(`Allocation success rate: ${((totalAllocated / totalRequired) * 100).toFixed(1)}%`);
    
    if (unallocatedSubjects.length > 0) {
      console.log('Unallocated periods:');
      unallocatedSubjects.forEach(subject => console.log(`  - ${subject}`));
    } else {
      console.log('✅ ALL PERIODS SUCCESSFULLY ALLOCATED!');
    }
  }

  private findBestSlot(subjectData: SubjectData, className: string): { day: number, period: number } | null {
    const teacherPreference = this.teacherPreferences.find(
      pref => pref.teacherName === subjectData.staff
    );

    // Check if teacher has exceeded max periods per week
    const currentWorkload = this.teacherWorkload.get(subjectData.staff) || 0;
    if (currentWorkload >= this.scheduleSettings.maxTeacherPeriodsPerWeek) {
      return null;
    }

    // Priority 1: Try preferred slots first (both subject and teacher preferences)
    const preferredSlots = this.getPreferredSlots(subjectData, teacherPreference);
    for (const slot of preferredSlots) {
      if (this.isSlotAvailable(slot.day, slot.period, className, subjectData.staff)) {
        return slot;
      }
    }

    // Priority 2: Find best available slot using smart distribution
    return this.findOptimalSlot(className, subjectData.staff);
  }

  private getPreferredSlots(subjectData: SubjectData, teacherPreference?: TeacherPreference): { day: number, period: number }[] {
    const slots: { day: number, period: number }[] = [];
    
    // Subject preferred day/period
    if (subjectData.preferredDay && subjectData.preferredPeriod) {
      const dayIndex = this.getDayIndex(subjectData.preferredDay);
      if (dayIndex !== -1) {
        slots.push({ day: dayIndex, period: subjectData.preferredPeriod - 1 });
      }
    }

    // Teacher preferred day/period
    if (teacherPreference) {
      const dayIndex = this.getDayIndex(teacherPreference.preferredDay);
      if (dayIndex !== -1) {
        slots.push({ day: dayIndex, period: teacherPreference.preferredPeriod - 1 });
      }
    }

    return slots;
  }

  private findOptimalSlot(className: string, teacher: string): { day: number, period: number } | null {
    const availableSlots: { day: number, period: number, score: number }[] = [];

    // Score all available slots
    for (let day = 0; day < 6; day++) {
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) {
          continue;
        }

        if (this.isSlotAvailable(day, period, className, teacher)) {
          const score = this.calculateSlotScore(day, period, className, teacher);
          availableSlots.push({ day, period, score });
        }
      }
    }

    // Sort by score (higher is better) and return the best slot
    availableSlots.sort((a, b) => b.score - a.score);
    return availableSlots.length > 0 ? { day: availableSlots[0].day, period: availableSlots[0].period } : null;
  }

  private calculateSlotScore(day: number, period: number, className: string, teacher: string): number {
    let score = 100; // Base score

    // Prefer earlier periods (morning classes are generally better)
    score += (10 - period) * 5;

    // Prefer spreading subjects across different days
    const classSchedule = this.classTimetables.get(className);
    if (classSchedule) {
      const daySubjects = classSchedule[day].filter(slot => slot.subject).length;
      score -= daySubjects * 10; // Penalty for overcrowded days
    }

    // Prefer spreading teacher's classes across different days
    const teacherSchedule = this.teacherTimetables.get(teacher);
    if (teacherSchedule) {
      const teacherDayClasses = teacherSchedule[day].filter(slot => slot.subject).length;
      score -= teacherDayClasses * 8; // Penalty for teacher overcrowding
    }

    // Avoid back-to-back periods for the same teacher if possible
    if (teacherSchedule && period > 0) {
      const prevSlot = teacherSchedule[day][period - 1];
      if (prevSlot.subject) score -= 15;
    }

    if (teacherSchedule && period < this.scheduleSettings.totalPeriodsPerDay - 1) {
      const nextSlot = teacherSchedule[day][period + 1];
      if (nextSlot.subject) score -= 15;
    }

    return score;
  }

  private findSlotWithRelaxedConstraints(subjectData: SubjectData, className: string): { day: number, period: number } | null {
    // Relax teacher workload constraint if needed
    const availableSlots: { day: number, period: number }[] = [];

    for (let day = 0; day < 6; day++) {
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) {
          continue;
        }

        // Only check basic availability (class and teacher slot free)
        if (this.isSlotAvailableBasic(day, period, className, subjectData.staff)) {
          availableSlots.push({ day, period });
        }
      }
    }

    // Return first available slot
    return availableSlots.length > 0 ? availableSlots[0] : null;
  }

  private isSlotAvailableBasic(day: number, period: number, className: string, teacher: string): boolean {
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