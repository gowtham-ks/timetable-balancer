import { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings, 
  TimeSlot, 
  ClassTimetable, 
  TeacherTimetable, 
  SubjectAllocation 
} from '../types/timetable';

export class TimetableGenerator {
  private subjectData: SubjectData[];
  private teacherPreferences: TeacherPreference[];
  private scheduleSettings: ScheduleSettings;
  private classTimetables: Map<string, TimeSlot[][]> = new Map();
  private teacherTimetables: Map<string, TimeSlot[][]> = new Map();
  private subjectAllocations: Map<string, SubjectAllocation> = new Map();
  private teacherWorkload: Map<string, number> = new Map();
  private labStaffSchedules: Map<string, TimeSlot[][]> = new Map();

  constructor(
    subjectData: SubjectData[], 
    teacherPreferences: TeacherPreference[], 
    scheduleSettings: ScheduleSettings
  ) {
    this.subjectData = subjectData;
    this.teacherPreferences = teacherPreferences;
    this.scheduleSettings = scheduleSettings;
    this.initializeAllocations();
  }

  private initializeAllocations(): void {
    this.subjectAllocations.clear();
    this.teacherWorkload.clear();
    
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

    // Initialize teacher workload for all staff (including lab assistants)
    this.subjectData.forEach(data => {
      const staffMembers = this.parseStaffMembers(data.staff);
      staffMembers.forEach(staff => {
        this.teacherWorkload.set(staff.trim(), 0);
      });
    });

    // Initialize empty timetables
    const uniqueClasses = [...new Set(this.subjectData.map(data => 
      `${data.department}-${data.year}-${data.section}`
    ))];

    // Get all unique teachers including individual lab staff members
    const allStaffMembers = new Set<string>();
    this.subjectData.forEach(data => {
      const staffMembers = this.parseStaffMembers(data.staff);
      staffMembers.forEach(staff => allStaffMembers.add(staff.trim()));
    });
    const uniqueTeachers = Array.from(allStaffMembers);

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
      this.labStaffSchedules.set(teacher, JSON.parse(JSON.stringify(schedule))); // Deep copy for lab staff tracking
    });
  }

  public generateTimetables(): { 
    classTimetables: ClassTimetable[], 
    teacherTimetables: TeacherTimetable[] 
  } {
    // Reset all allocations
    this.resetAllocations();

    // Multiple passes to ensure all subjects get allocated - dramatically increased for better allocation
    let maxAttempts = 50;
    let bestScore = 0;
    let bestClassTimetables = new Map(this.classTimetables);
    let bestTeacherTimetables = new Map(this.teacherTimetables);
    let bestAllocations = new Map(this.subjectAllocations);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`\n🔄 Generation Attempt ${attempt + 1}/${maxAttempts}`);
      
      this.resetAllocations();
      this.allocateSubjects();
      
      const currentScore = this.calculateAllocationScore();
      console.log(`📊 Attempt ${attempt + 1} Score: ${(currentScore * 100).toFixed(1)}%`);
      
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestClassTimetables = new Map(JSON.parse(JSON.stringify([...this.classTimetables])));
        bestTeacherTimetables = new Map(JSON.parse(JSON.stringify([...this.teacherTimetables])));
        bestAllocations = new Map(this.subjectAllocations);
        
        console.log(`✨ New best score: ${(bestScore * 100).toFixed(1)}%`);
        
        // If we achieve perfect allocation, stop
        if (bestScore >= 0.99) {
          console.log('🎯 Perfect allocation achieved!');
          break;
        }
      }
      
      // Early termination if good enough score is reached
      if (currentScore >= 0.95 && attempt >= 10) {
        console.log(`✅ Good enough score (${(currentScore * 100).toFixed(1)}%) reached after ${attempt + 1} attempts`);
        break;
      }
    }

    // Restore best results
    this.classTimetables = bestClassTimetables;
    this.teacherTimetables = bestTeacherTimetables;
    this.subjectAllocations = bestAllocations;

    console.log(`\n🏆 Final Results:`);
    console.log(`📊 Best Score: ${(bestScore * 100).toFixed(1)}%`);
    console.log(this.getAllocationSummary());

    const classTimetables: ClassTimetable[] = [];
    const consolidatedTeacherTimetables: TeacherTimetable[] = [];

    this.classTimetables.forEach((schedule, className) => {
      classTimetables.push({ className, schedule });
    });

    // Consolidate teacher timetables by merging all schedules for each teacher
    const teacherScheduleMap = this.consolidateTeacherSchedules();
    teacherScheduleMap.forEach((schedule, teacherName) => {
      consolidatedTeacherTimetables.push({ teacherName, schedule });
    });

    return { 
      classTimetables, 
      teacherTimetables: consolidatedTeacherTimetables
    };
  }

  private resetAllocations(): void {
    // Reset subject allocations
    this.subjectAllocations.forEach(allocation => {
      allocation.allocatedPeriods = 0;
    });

    // Reset teacher workload
    this.teacherWorkload.forEach((_, teacher) => {
      this.teacherWorkload.set(teacher, 0);
    });

    // Reset class timetables
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.classTimetables.forEach((schedule, className) => {
      schedule.forEach((daySchedule, dayIndex) => {
        daySchedule.forEach((slot, periodIndex) => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
          slot.day = days[dayIndex];
          slot.period = periodIndex + 1;
        });
      });
    });

    // Reset teacher timetables
    this.teacherTimetables.forEach((schedule, teacherName) => {
      schedule.forEach((daySchedule, dayIndex) => {
        daySchedule.forEach((slot, periodIndex) => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
          slot.day = days[dayIndex];
          slot.period = periodIndex + 1;
        });
      });
    });

    // Reset lab staff schedules
    this.labStaffSchedules.forEach((schedule) => {
      schedule.forEach((daySchedule, dayIndex) => {
        daySchedule.forEach((slot, periodIndex) => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
          slot.day = days[dayIndex];
          slot.period = periodIndex + 1;
        });
      });
    });
  }

  private allocateSubjects(): void {
    const sortedSubjects = this.getSortedSubjectsByPriority();

    sortedSubjects.forEach(subjectData => {
      const className = `${subjectData.department}-${subjectData.year}-${subjectData.section}`;
      
      if (this.isLabSubject(subjectData.subject)) {
        this.allocateConsecutivePeriods(subjectData, className);
      } else if (this.isLibrarySubject(subjectData.subject)) {
        this.allocateLibraryPeriods(subjectData, className);
      } else if (this.isGamesSubject(subjectData.subject)) {
        this.allocateGamesPeriods(subjectData, className);
      } else {
        this.allocateRegularPeriods(subjectData, className);
      }
    });
  }

  private getSortedSubjectsByPriority(): SubjectData[] {
    return [...this.subjectData].sort((a, b) => {
      // First priority: Lab subjects (they need consecutive periods)
      const aIsLab = this.isLabSubject(a.subject);
      const bIsLab = this.isLabSubject(b.subject);
      if (aIsLab && !bIsLab) return -1;
      if (!aIsLab && bIsLab) return 1;
      
      // Second priority: Subjects with more periods (harder to schedule)
      if (a.periods !== b.periods) {
        return b.periods - a.periods;
      }
      
      // Third priority: Subjects with teacher preferences
      const aHasPref = this.teacherPreferences.some(pref => 
        a.staff.includes(pref.teacherName)
      );
      const bHasPref = this.teacherPreferences.some(pref => 
        b.staff.includes(pref.teacherName)
      );
      if (aHasPref && !bHasPref) return -1;
      if (!aHasPref && bHasPref) return 1;
      
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

  private parseStaffMembers(staffString: string): string[] {
    // Parse staff members from comma or + separated string
    if (!staffString) return [];
    return staffString.split(/[,+]/).map(s => s.trim()).filter(s => s.length > 0);
  }

  private isLabSubject(subject: string | undefined): boolean {
    if (!subject) return false;
    return subject.toLowerCase().includes('lab') || 
           subject.toLowerCase().includes('practical') ||
           subject.toLowerCase().includes('workshop');
  }

  private isLibrarySubject(subject: string | undefined): boolean {
    if (!subject) return false;
    return subject.toLowerCase().includes('library');
  }

  private isGamesSubject(subject: string | undefined): boolean {
    if (!subject) return false;
    return subject.toLowerCase().includes('games') || 
           subject.toLowerCase().includes('sports') ||
           subject.toLowerCase().includes('physical education') ||
           subject.toLowerCase().includes('pt') ||
           subject.toLowerCase().includes('aptitude') ||
           subject.toLowerCase().includes('spd') ||
           subject.toLowerCase().includes('nptel');
  }

  private getRemainingPeriods(subjectData: SubjectData): number {
    const className = `${subjectData.department}-${subjectData.year}-${subjectData.section}`;
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey);
    return allocation ? allocation.requiredPeriods - allocation.allocatedPeriods : 0;
  }

  private allocateConsecutivePeriods(subjectData: SubjectData, className: string): void {
    const remainingPeriods = this.getRemainingPeriods(subjectData);
    if (remainingPeriods <= 0) return;

    // ALL labs must have consecutive periods on the same day
    this.allocateAllLabPeriodsConsecutively(subjectData, className, remainingPeriods);
  }

  private allocateAllLabPeriodsConsecutively(subjectData: SubjectData, className: string, remainingPeriods: number): void {
    console.log(`🔬 Allocating ${remainingPeriods} consecutive lab periods for ${subjectData.subject} in ${className} with staff: "${subjectData.staff}"`);
    
    const staffMembers = this.parseStaffMembers(subjectData.staff);
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Try to find a day where ALL periods can be allocated consecutively
    for (let day = 0; day < 6; day++) {
      // Skip if this day already has a different lab for this class (only one lab subject per day)
      if (this.hasDifferentLabOnDay(className, day, subjectData.subject)) continue;

      let consecutiveSlots: number[] = [];
      let currentSequence: number[] = [];
      
      // Find consecutive slots on this day (can span break periods but not lunch)
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch period entirely
        if (period + 1 === this.scheduleSettings.lunchPeriod) {
          // If we have enough slots before lunch, use them
          if (currentSequence.length >= remainingPeriods) {
            consecutiveSlots = currentSequence.slice(0, remainingPeriods);
            break;
          }
          // Start new sequence after lunch (don't reset - allow continuation after break periods)
          currentSequence = [];
          continue;
        }
        
        // Allow allocation on break periods for labs (they can span breaks)
        if (this.isLabSlotAvailable(day, period, className, subjectData.staff, subjectData.subject)) {
          currentSequence.push(period);
          
          // If we have enough consecutive slots, we can use this sequence
          if (currentSequence.length >= remainingPeriods) {
            consecutiveSlots = currentSequence.slice(0, remainingPeriods);
            break;
          }
        } else {
          // If we have enough slots before hitting obstacle, use them
          if (currentSequence.length >= remainingPeriods) {
            consecutiveSlots = currentSequence.slice(0, remainingPeriods);
            break;
          }
          currentSequence = [];
        }
      }
      
      // If we found enough consecutive slots, allocate them
      if (consecutiveSlots.length >= remainingPeriods) {
        for (let i = 0; i < remainingPeriods; i++) {
          const period = consecutiveSlots[i];
          const slot = { day, period };
          this.assignLabSlotWithTracking(slot, subjectData, className);
          allocation.allocatedPeriods++;
        }
        
        // Update workload for all staff members
        staffMembers.forEach(staff => {
          const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
          this.teacherWorkload.set(staff.trim(), currentWorkload + remainingPeriods);
        });
        
        const startPeriod = consecutiveSlots[0];
        const endPeriod = consecutiveSlots[remainingPeriods - 1];
        console.log(`✅ Allocated ${remainingPeriods} consecutive lab periods for ${subjectData.subject} in ${className} on ${this.getDayName(day)} periods ${startPeriod + 1}-${endPeriod + 1}`);
        return;
      }
    }
    
    console.error(`❌ Could not allocate ${remainingPeriods} consecutive lab periods for ${subjectData.subject} in ${className} - Need all periods consecutive on same day`);
  }

  private hasDifferentLabOnDay(className: string, day: number, currentSubject: string): boolean {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return false;
    
    return classSchedule[day].some(slot => 
      slot.subject && 
      this.isLabSubject(slot.subject) && 
      slot.subject !== currentSubject
    );
  }

  private hasLabOnDay(className: string, day: number): boolean {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return false;
    
    return classSchedule[day].some(slot => 
      slot.subject && this.isLabSubject(slot.subject)
    );
  }

  private hasSubjectOnDay(className: string, day: number, subject: string): boolean {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return false;
    
    return classSchedule[day].some(slot => 
      slot.subject === subject
    );
  }


  private assignLabSlotWithTracking(slot: { day: number; period: number }, subjectData: SubjectData, className: string): void {
    const { day, period } = slot;
    const staffMembers = this.parseStaffMembers(subjectData.staff);
    
    // Assign to class timetable - show all 3 staff members
    const classSchedule = this.classTimetables.get(className);
    if (classSchedule) {
      classSchedule[day][period].subject = subjectData.subject;
      classSchedule[day][period].staff = staffMembers.join(', '); // Show all staff members
      classSchedule[day][period].className = className;
    }

    // Assign to each individual teacher's timetable and block them from other assignments
    staffMembers.forEach(staff => {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (teacherSchedule) {
        teacherSchedule[day][period].subject = subjectData.subject;
        teacherSchedule[day][period].staff = staff.trim();
        teacherSchedule[day][period].className = className;
      }
    });
  }

  private allocateLibraryPeriods(subjectData: SubjectData, className: string): void {
    const remainingPeriods = this.getRemainingPeriods(subjectData);
    if (remainingPeriods <= 0) return;

    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Try to allocate library periods in later periods of the day
    for (let period = Math.floor(this.scheduleSettings.totalPeriodsPerDay * 0.7); 
         period < this.scheduleSettings.totalPeriodsPerDay && allocation.allocatedPeriods < allocation.requiredPeriods; 
         period++) {
      
      // Skip lunch and break periods
      if (period + 1 === this.scheduleSettings.lunchPeriod || 
          this.scheduleSettings.breakPeriods.includes(period + 1)) continue;

      for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
        if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
          this.assignSlotWithTracking(day, period, subjectData, className);
          allocation.allocatedPeriods++;
        }
      }
    }

    // If not all periods allocated, try any available slot
    for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay && allocation.allocatedPeriods < allocation.requiredPeriods; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) continue;

        if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
          this.assignSlotWithTracking(day, period, subjectData, className);
          allocation.allocatedPeriods++;
        }
      }
    }
  }

  private allocateGamesPeriods(subjectData: SubjectData, className: string): void {
    const remainingPeriods = this.getRemainingPeriods(subjectData);
    if (remainingPeriods <= 0) return;

    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Prefer afternoon slots for games/sports
    for (let period = Math.floor(this.scheduleSettings.totalPeriodsPerDay * 0.6); 
         period < this.scheduleSettings.totalPeriodsPerDay && allocation.allocatedPeriods < allocation.requiredPeriods; 
         period++) {
      
      // Skip lunch and break periods
      if (period + 1 === this.scheduleSettings.lunchPeriod || 
          this.scheduleSettings.breakPeriods.includes(period + 1)) continue;

      for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
        if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
          this.assignSlotWithTracking(day, period, subjectData, className);
          allocation.allocatedPeriods++;
        }
      }
    }

    // If not all periods allocated, try any available slot
    for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay && allocation.allocatedPeriods < allocation.requiredPeriods; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) continue;

        if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
          this.assignSlotWithTracking(day, period, subjectData, className);
          allocation.allocatedPeriods++;
        }
      }
    }
  }

  private allocateRegularPeriods(subjectData: SubjectData, className: string): void {
    const remainingPeriods = this.getRemainingPeriods(subjectData);
    if (remainingPeriods <= 0) return;

    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Try to allocate periods while avoiding repetition on the same day
    for (let i = 0; i < remainingPeriods; i++) {
      let allocated = false;
      
      // First pass: try to find slots without repetition
      for (let day = 0; day < 6 && !allocated; day++) {
        for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay && !allocated; period++) {
          // Skip lunch and break periods
          if (period + 1 === this.scheduleSettings.lunchPeriod || 
              this.scheduleSettings.breakPeriods.includes(period + 1)) continue;

          if (this.isSlotAvailable(day, period, className, subjectData.staff) && 
              !this.wouldCreateRepetition(day, period, className, subjectData.subject)) {
            this.assignSlotWithTracking(day, period, subjectData, className);
            allocation.allocatedPeriods++;
            allocated = true;
          }
        }
      }
      
      // If no non-repetitive slot found, use any available slot
      if (!allocated) {
        for (let day = 0; day < 6 && !allocated; day++) {
          for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay && !allocated; period++) {
            // Skip lunch and break periods
            if (period + 1 === this.scheduleSettings.lunchPeriod || 
                this.scheduleSettings.breakPeriods.includes(period + 1)) continue;

            if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
              this.assignSlotWithTracking(day, period, subjectData, className);
              allocation.allocatedPeriods++;
              allocated = true;
            }
          }
        }
      }
      
      // Break if we couldn't allocate any more periods
      if (!allocated) break;
    }
  }

  private isLabSlotAvailable(day: number, period: number, className: string, staff: string, subject: string): boolean {
    // Lab periods can be scheduled during break periods (they can span breaks but not lunch)
    const isLunchPeriod = (period + 1) === this.scheduleSettings.lunchPeriod;
    
    // Labs cannot be scheduled during lunch
    if (isLunchPeriod) {
      return false;
    }
    
    // Check basic availability (class and teacher availability)
    if (!this.isSlotAvailable(day, period, className, staff)) {
      return false;
    }

    // Additional check: ensure no different lab is scheduled at this slot for this class
    const classKey = className;
    const classTimetable = this.classTimetables.get(classKey);
    if (classTimetable && classTimetable[day] && classTimetable[day][period]) {
      const existingSubject = classTimetable[day][period].subject;
      if (this.isLabSubject(existingSubject) && existingSubject !== subject) {
        return false; // Different lab already scheduled
      }
    }

    return true;
  }

  private isSlotAvailable(day: number, period: number, className: string, staffString: string): boolean {
    // Check class availability
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule || classSchedule[day][period].subject) return false;

    // Check teacher availability
    const staffMembers = this.parseStaffMembers(staffString);
    for (const staff of staffMembers) {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (!teacherSchedule || teacherSchedule[day][period].subject) {
        return false;
      }
      
      // Check if teacher is within maximum periods per week
      const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
      if (currentWorkload >= this.scheduleSettings.maxTeacherPeriodsPerWeek) {
        return false;
      }
    }

    return true;
  }

  private assignSlotWithTracking(day: number, period: number, subjectData: SubjectData, className: string): void {
    const staffMembers = this.parseStaffMembers(subjectData.staff);
    
    // Assign to class timetable
    const classSchedule = this.classTimetables.get(className);
    if (classSchedule) {
      classSchedule[day][period].subject = subjectData.subject;
      classSchedule[day][period].staff = subjectData.staff;
      classSchedule[day][period].className = className;
    }

    // Assign to teacher timetable and update workload
    staffMembers.forEach(staff => {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (teacherSchedule) {
        teacherSchedule[day][period].subject = subjectData.subject;
        teacherSchedule[day][period].staff = staff.trim();
        teacherSchedule[day][period].className = className;
      }
      
      // Update teacher workload
      const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
      this.teacherWorkload.set(staff.trim(), currentWorkload + 1);
    });
  }

  private wouldCreateRepetition(day: number, period: number, className: string, subject: string): boolean {
    // For lab subjects, allow repetition (consecutive periods)
    if (this.isLabSubject(subject)) {
      return false;
    }
    
    // For non-lab subjects, check if subject already exists on this day
    return this.hasSubjectOnDay(className, day, subject);
  }

  private getDayIndex(dayName: string): number {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(dayName.toLowerCase());
  }

  private getDayName(dayIndex: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  private isAllocationComplete(): boolean {
    for (const allocation of this.subjectAllocations.values()) {
      if (allocation.allocatedPeriods < allocation.requiredPeriods) {
        return false;
      }
    }
    return true;
  }

  private getAllocationSummary(): any {
    const total = this.subjectAllocations.size;
    let completed = 0;
    let totalRequired = 0;
    let totalAllocated = 0;

    this.subjectAllocations.forEach(allocation => {
      totalRequired += allocation.requiredPeriods;
      totalAllocated += allocation.allocatedPeriods;
      if (allocation.allocatedPeriods >= allocation.requiredPeriods) {
        completed++;
      }
    });

    return {
      completedSubjects: completed,
      totalSubjects: total,
      completionRate: `${Math.round((completed / total) * 100)}%`,
      periodsAllocated: totalAllocated,
      periodsRequired: totalRequired,
      allocationRate: `${Math.round((totalAllocated / totalRequired) * 100)}%`
    };
  }

  public getCurrentState(): {
    subjectData: SubjectData[];
    teacherPreferences: TeacherPreference[];
    scheduleSettings: ScheduleSettings;
    classTimetables: ClassTimetable[];
    teacherTimetables: TeacherTimetable[];
    subjectAllocations: Map<string, SubjectAllocation>;
  } {
    const classTimetables: ClassTimetable[] = [];
    const teacherTimetables: TeacherTimetable[] = [];

    this.classTimetables.forEach((schedule, className) => {
      classTimetables.push({ className, schedule });
    });

    this.teacherTimetables.forEach((schedule, teacherName) => {
      teacherTimetables.push({ teacherName, schedule });
    });

    return {
      subjectData: this.subjectData,
      teacherPreferences: this.teacherPreferences,
      scheduleSettings: this.scheduleSettings,
      classTimetables,
      teacherTimetables,
      subjectAllocations: this.subjectAllocations
    };
  }

  private calculateAllocationScore(): number {
    let score = 0;
    this.subjectAllocations.forEach(allocation => {
      score += allocation.allocatedPeriods / allocation.requiredPeriods;
    });
    return score / this.subjectAllocations.size;
  }

  private consolidateTeacherSchedules(): Map<string, TimeSlot[][]> {
    const consolidatedSchedules = new Map<string, TimeSlot[][]>();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize empty schedules for all teachers
    this.teacherTimetables.forEach((schedule, teacherName) => {
      const emptySchedule: TimeSlot[][] = days.map(day => 
        Array(this.scheduleSettings.totalPeriodsPerDay).fill(null).map((_, period) => ({
          day,
          period: period + 1
        }))
      );
      consolidatedSchedules.set(teacherName, emptySchedule);
    });

    // Merge all assignments for each teacher
    this.teacherTimetables.forEach((schedule, teacherName) => {
      const consolidatedSchedule = consolidatedSchedules.get(teacherName)!;
      
      schedule.forEach((daySchedule, dayIndex) => {
        daySchedule.forEach((slot, periodIndex) => {
          if (slot.subject) {
            consolidatedSchedule[dayIndex][periodIndex] = {
              day: slot.day,
              period: slot.period,
              subject: slot.subject,
              staff: slot.staff,
              className: slot.className
            };
          }
        });
      });
    });

    return consolidatedSchedules;
  }
}
