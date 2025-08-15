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
    let maxAttempts = 500;
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

    // Convert maps to arrays for return
    const classTimetables: ClassTimetable[] = [];
    const teacherTimetables: TeacherTimetable[] = [];

    this.classTimetables.forEach((schedule, className) => {
      classTimetables.push({ className, schedule });
    });

    this.teacherTimetables.forEach((schedule, teacherName) => {
      teacherTimetables.push({ teacherName, schedule });
    });

    console.log(`\n🎯 Generation complete after ${attempt} attempts`);
    console.log(`📊 Final allocation status:`, this.getAllocationSummary());

    return { classTimetables, teacherTimetables };
  }

  private resetAllocations(): void {
    // Reset subject allocation counts
    this.subjectAllocations.forEach(allocation => {
      allocation.allocatedPeriods = 0;
    });

    // Reset teacher workloads
    this.teacherWorkload.forEach((_, teacher) => {
      this.teacherWorkload.set(teacher, 0);
    });

    // Clear all timetable assignments
    this.classTimetables.forEach(schedule => {
      schedule.forEach(day => {
        day.forEach(slot => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
        });
      });
    });

    this.teacherTimetables.forEach(schedule => {
      schedule.forEach(day => {
        day.forEach(slot => {
          slot.subject = undefined;
          slot.staff = undefined;
          slot.className = undefined;
        });
      });
    });
  }

  private allocateSubjectCompletely(subjectData: SubjectData): void {
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
  }

  private getSortedSubjects(): SubjectData[] {
    return [...this.subjectData].sort((a, b) => {
      // First priority: Lab subjects (harder to place)
      const aIsLab = this.isLabSubject(a.subject);
      const bIsLab = this.isLabSubject(b.subject);
      if (aIsLab && !bIsLab) return -1;
      if (!aIsLab && bIsLab) return 1;
      
      // Second priority: More periods first
      if (a.periods !== b.periods) {
        return b.periods - a.periods;
      }
      
      // Third priority: Teacher preferences
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

  private isLabSubject(subject: string): boolean {
    return subject.toLowerCase().includes('lab') || 
           subject.toLowerCase().includes('practical') ||
           subject.toLowerCase().includes('workshop');
  }

  private isLibrarySubject(subject: string): boolean {
    return subject.toLowerCase().includes('library');
  }

  private isGamesSubject(subject: string): boolean {
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

    // Special handling for DSP labs - must be consecutive on same day
    if (subjectData.subject.toLowerCase().includes('data structures') && 
        subjectData.subject.toLowerCase().includes('python')) {
      this.allocateDSPLabPeriods(subjectData, className, remainingPeriods);
    } else {
      // Other labs should be on different days, but still consecutive periods
      this.allocateOtherLabPeriods(subjectData, className, remainingPeriods);
    }
  }

  private allocateDSPLabPeriods(subjectData: SubjectData, className: string, remainingPeriods: number): void {
    console.log(`🔬 Allocating ${remainingPeriods} DSP lab periods for ${subjectData.subject} in ${className} with staff: "${subjectData.staff}"`);
    
    const staffMembers = this.parseStaffMembers(subjectData.staff);
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Try to find consecutive periods on the same day
    for (let day = 0; day < 6; day++) {
      let consecutiveFound = 0;
      let startPeriod = -1;
      
      // Find the longest consecutive block available on this day
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) {
          consecutiveFound = 0;
          startPeriod = -1;
          continue;
        }
        
        if (this.isLabSlotAvailable(day, period, className, subjectData.staff, subjectData.subject)) {
          if (startPeriod === -1) startPeriod = period;
          consecutiveFound++;
          
          // If we found enough consecutive slots, allocate them
          if (consecutiveFound >= remainingPeriods) {
            for (let i = 0; i < remainingPeriods; i++) {
              const slot = { day, period: startPeriod + i };
              this.assignLabSlotWithTracking(slot, subjectData, className);
              allocation.allocatedPeriods++;
            }
            
            // Update workload for all staff members
            staffMembers.forEach(staff => {
              const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
              this.teacherWorkload.set(staff.trim(), currentWorkload + remainingPeriods);
            });
            
            console.log(`✅ Allocated ${remainingPeriods} consecutive DSP lab periods for ${subjectData.subject} in ${className} on ${this.getDayName(day)} periods ${startPeriod + 1}-${startPeriod + remainingPeriods}`);
            return;
          }
        } else {
          consecutiveFound = 0;
          startPeriod = -1;
        }
      }
    }
    
    console.error(`❌ Could not allocate ${remainingPeriods} consecutive DSP lab periods for ${subjectData.subject} in ${className}`);
  }

  private allocateOtherLabPeriods(subjectData: SubjectData, className: string, remainingPeriods: number): void {
    console.log(`🔬 Allocating ${remainingPeriods} lab periods for ${subjectData.subject} in ${className} with staff: "${subjectData.staff}"`);
    
    const staffMembers = this.parseStaffMembers(subjectData.staff);
    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // For labs, MUST be consecutive periods on the same day, and only one lab per day per class
    let periodsAllocated = 0;

    for (let day = 0; day < 6 && periodsAllocated < remainingPeriods; day++) {
      // Skip if this day already has ANY lab for this class (enforce one lab per day rule)
      if (this.hasLabOnDay(className, day)) continue;

      let consecutiveFound = 0;
      let startPeriod = -1;
      let availableSlots: number[] = [];
      
      // Find all available consecutive periods on this day
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) {
          // Reset consecutive tracking when hitting breaks
          if (availableSlots.length >= remainingPeriods - periodsAllocated) {
            break; // We found enough slots before the break
          }
          availableSlots = [];
          consecutiveFound = 0;
          startPeriod = -1;
          continue;
        }
        
        if (this.isLabSlotAvailable(day, period, className, subjectData.staff, subjectData.subject)) {
          if (startPeriod === -1) startPeriod = period;
          availableSlots.push(period);
          consecutiveFound++;
        } else {
          // Reset if we hit a non-available slot
          if (availableSlots.length >= remainingPeriods - periodsAllocated) {
            break; // We found enough consecutive slots
          }
          availableSlots = [];
          consecutiveFound = 0;
          startPeriod = -1;
        }
      }
      
      // If we found enough consecutive periods, allocate all remaining periods on this day
      const periodsToAllocate = Math.min(availableSlots.length, remainingPeriods - periodsAllocated);
      if (periodsToAllocate >= Math.min(2, remainingPeriods - periodsAllocated)) {
        // Allocate consecutive periods starting from the first available slot
        for (let i = 0; i < periodsToAllocate; i++) {
          const period = availableSlots[i];
          const slot = { day, period };
          this.assignLabSlotWithTracking(slot, subjectData, className);
          allocation.allocatedPeriods++;
          periodsAllocated++;
        }
        
        // Update workload for all staff members
        staffMembers.forEach(staff => {
          const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
          this.teacherWorkload.set(staff.trim(), currentWorkload + periodsToAllocate);
        });
        
        console.log(`✅ Allocated ${periodsToAllocate} consecutive lab periods for ${subjectData.subject} in ${className} on ${this.getDayName(day)} periods ${availableSlots[0] + 1}-${availableSlots[periodsToAllocate - 1] + 1}`);
        
        // If we've allocated all required periods, we're done
        if (periodsAllocated >= remainingPeriods) break;
      }
    }
    
    if (periodsAllocated < remainingPeriods) {
      console.error(`❌ Could not allocate remaining ${remainingPeriods - periodsAllocated} lab periods for ${subjectData.subject} in ${className} - Need consecutive slots and one lab per day rule`);
    }
    
    console.log(`📊 Lab allocation complete for ${subjectData.subject}: ${periodsAllocated}/${remainingPeriods} periods allocated`);
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

  private isLabSlotAvailable(day: number, period: number, className: string, staffString: string, subjectName: string): boolean {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule || classSchedule[day][period].subject) return false;

    // Check if there's already another lab on this day for this class
    const daySchedule = classSchedule[day];
    const hasLabToday = daySchedule.some(slot => slot.subject && this.isLabSubject(slot.subject));
    
    // Allow only one lab per day per class (DSP labs can have multiple consecutive periods on same day)
    const isDSPLab = subjectName.toLowerCase().includes('data structures') && 
                     subjectName.toLowerCase().includes('python');
    if (hasLabToday && !isDSPLab) return false;

    const staffMembers = this.parseStaffMembers(staffString);
    
    // Check if ALL staff members are available for the entire lab duration
    for (const staff of staffMembers) {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (!teacherSchedule || teacherSchedule[day][period].subject) {
        return false;
      }
    }
    
    return true;
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
          
          console.log(`✅ Allocated library period for ${subjectData.subject} in ${className} on ${this.getDayName(day)} period ${period + 1}`);
        }
      }
    }
  }

  private allocateGamesPeriods(subjectData: SubjectData, className: string): void {
    const remainingPeriods = this.getRemainingPeriods(subjectData);
    if (remainingPeriods <= 0) return;

    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Try to allocate games periods in the last period of the day
    const lastPeriod = this.scheduleSettings.totalPeriodsPerDay - 1;
    
    for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
      if (this.isSlotAvailable(day, lastPeriod, className, subjectData.staff)) {
        this.assignSlotWithTracking(day, lastPeriod, subjectData, className);
        allocation.allocatedPeriods++;
        
        console.log(`✅ Allocated games period for ${subjectData.subject} in ${className} on ${this.getDayName(day)} last period`);
      }
    }

    // If we still need to allocate more, try other periods
    if (allocation.allocatedPeriods < allocation.requiredPeriods) {
      for (let period = Math.floor(this.scheduleSettings.totalPeriodsPerDay * 0.8); 
           period < this.scheduleSettings.totalPeriodsPerDay && allocation.allocatedPeriods < allocation.requiredPeriods; 
           period++) {
        
        // Skip lunch and break periods and the last period (already tried)
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1) ||
            period === lastPeriod) continue;

        for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
          if (this.isSlotAvailable(day, period, className, subjectData.staff)) {
            this.assignSlotWithTracking(day, period, subjectData, className);
            allocation.allocatedPeriods++;
            
            console.log(`✅ Allocated games period for ${subjectData.subject} in ${className} on ${this.getDayName(day)} period ${period + 1}`);
          }
        }
      }
    }
  }

  private allocateRegularPeriods(subjectData: SubjectData, className: string): void {
    const remainingPeriods = this.getRemainingPeriods(subjectData);
    if (remainingPeriods <= 0) return;

    const subjectKey = `${subjectData.subject}-${className}`;
    const allocation = this.subjectAllocations.get(subjectKey)!;

    // Try to respect teacher preferences first
    const teacherPref = this.teacherPreferences.find(pref => 
      subjectData.staff.includes(pref.teacherName)
    );

    if (teacherPref) {
      const prefDay = this.getDayIndex(teacherPref.preferredDay);
      const prefPeriod = teacherPref.preferredPeriod - 1;
      
      if (prefDay >= 0 && prefPeriod >= 0 && 
          this.isSlotAvailable(prefDay, prefPeriod, className, subjectData.staff)) {
        this.assignSlotWithTracking(prefDay, prefPeriod, subjectData, className);
        allocation.allocatedPeriods++;
      }
    }

    // Fill remaining periods using anti-repetition strategy
    while (allocation.allocatedPeriods < allocation.requiredPeriods) {
      let allocated = false;
      
      // Try to find a slot that doesn't create consecutive periods of the same subject
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
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return false;

    const daySchedule = classSchedule[day];
    
    // Check adjacent periods
    if (period > 0 && daySchedule[period - 1].subject === subject) return true;
    if (period < daySchedule.length - 1 && daySchedule[period + 1].subject === subject) return true;
    
    return false;
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
}
