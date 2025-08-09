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
  private subjectPeriodUsage: Map<string, Set<number>> = new Map(); // Track which periods each subject-class combination uses (to prevent repetition across days)
  private libraryOccupancy: Map<string, string> = new Map(); // Track library usage: "day-period" -> className
  private labStaffSchedules: Map<string, TimeSlot[][]> = new Map(); // Track individual lab staff schedules

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

    // Reset teacher workload for all staff
    this.teacherWorkload.clear();
    this.subjectData.forEach(data => {
      const staffMembers = this.parseStaffMembers(data.staff);
      staffMembers.forEach(staff => {
        this.teacherWorkload.set(staff.trim(), 0);
      });
    });

    // Reset library occupancy
    this.libraryOccupancy.clear();

    // Reset subject period usage tracking (per class)
    this.subjectPeriodUsage.clear();
    this.subjectData.forEach(data => {
      const className = `${data.department}-${data.year}-${data.section}`;
      const subjectClassKey = `${data.subject}-${className}`;
      this.subjectPeriodUsage.set(subjectClassKey, new Set());
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

    // Reset lab staff schedules
    this.labStaffSchedules.forEach(schedule => {
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
      // Prioritize lab subjects first (they need consecutive periods)
      const aIsLab = this.isLabSubject(a.subject);
      const bIsLab = this.isLabSubject(b.subject);
      if (aIsLab !== bIsLab) {
        return bIsLab ? 1 : -1; // Labs first
      }
      
      // Then by remaining periods (descending) - allocate high-period subjects first
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
           subject.toLowerCase().includes('pt');
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

    const isLab = this.isLabSubject(subjectData.subject);
    const isLibrary = this.isLibrarySubject(subjectData.subject);
    const isGames = this.isGamesSubject(subjectData.subject);
    const remainingPeriods = allocation.requiredPeriods - allocation.allocatedPeriods;
    
    if (isLab && remainingPeriods > 1) {
      // For lab subjects, try to allocate consecutive periods
      this.allocateConsecutivePeriods(subjectData, className, remainingPeriods);
    } else if (isGames) {
      // For games periods, allocate at last period
      this.allocateGamesPeriods(subjectData, className);
    } else if (isLibrary) {
      // For library periods, ensure exclusivity
      this.allocateLibraryPeriods(subjectData, className);
    } else {
      // For regular subjects, allocate individually with anti-repetition logic
      while (allocation.allocatedPeriods < allocation.requiredPeriods) {
        const slot = this.findBestSlotWithAntiRepetition(subjectData, className);
        
        if (slot) {
          this.assignSlotWithTracking(slot, subjectData, className);
          allocation.allocatedPeriods++;
          
          // Update teacher workload
          const staffMembers = this.parseStaffMembers(subjectData.staff);
          const primaryStaff = staffMembers[0] || subjectData.staff;
          const currentWorkload = this.teacherWorkload.get(primaryStaff) || 0;
          this.teacherWorkload.set(primaryStaff, currentWorkload + 1);
        } else {
          // If we can't find a slot, try relaxing constraints
          const relaxedSlot = this.findSlotWithRelaxedConstraints(subjectData, className);
          if (relaxedSlot) {
            this.assignSlotWithTracking(relaxedSlot, subjectData, className);
            allocation.allocatedPeriods++;
            
            const staffMembers = this.parseStaffMembers(subjectData.staff);
            const primaryStaff = staffMembers[0] || subjectData.staff;
            const currentWorkload = this.teacherWorkload.get(primaryStaff) || 0;
            this.teacherWorkload.set(primaryStaff, currentWorkload + 1);
          } else {
            // Can't allocate this period, log and break
            console.warn(`Could not allocate period for ${subjectData.subject} in ${className}. 
              Allocated: ${allocation.allocatedPeriods}/${allocation.requiredPeriods}`);
            break;
          }
        }
      }
    }
  }

  private allocateConsecutivePeriods(subjectData: SubjectData, className: string, periodsNeeded: number) {
    const allocation = this.subjectAllocations.get(`${subjectData.subject}-${className}`);
    if (!allocation) return;

    // For lab periods, we need to allocate all of them as continuous blocks
    // We'll try to find consecutive slots that can accommodate all required periods
    const maxConsecutiveBlock = Math.min(3, periodsNeeded); // Maximum 3 consecutive periods per block
    const blocksNeeded = Math.ceil(periodsNeeded / maxConsecutiveBlock);
    
    let allocatedPeriods = 0;
    
    for (let block = 0; block < blocksNeeded && allocatedPeriods < periodsNeeded; block++) {
      const periodsInThisBlock = Math.min(maxConsecutiveBlock, periodsNeeded - allocatedPeriods);
      
      // Try to find consecutive slots for this block
      let blockAllocated = false;
      
      for (let day = 0; day < 6 && !blockAllocated; day++) {
        for (let startPeriod = 0; startPeriod <= this.scheduleSettings.totalPeriodsPerDay - periodsInThisBlock; startPeriod++) {
          // Check if we can place consecutive periods here
          let canPlaceConsecutive = true;
          const consecutiveSlots: { day: number, period: number }[] = [];
          
          for (let i = 0; i < periodsInThisBlock; i++) {
            const period = startPeriod + i;
            
            // Skip if this is a break/lunch period
            if (period + 1 === this.scheduleSettings.lunchPeriod || 
                this.scheduleSettings.breakPeriods.includes(period + 1)) {
              canPlaceConsecutive = false;
              break;
            }
            
            // For lab periods, check all lab staff members
            if (!this.isLabSlotAvailable(day, period, className, subjectData.staff)) {
              canPlaceConsecutive = false;
              break;
            }
            
            consecutiveSlots.push({ day, period });
          }
          
          if (canPlaceConsecutive) {
            // Assign all consecutive periods for lab with multiple staff members
            for (const slot of consecutiveSlots) {
              this.assignLabSlotWithTracking(slot, subjectData, className);
              allocation.allocatedPeriods++;
              allocatedPeriods++;
              
              // Update workload for all lab staff members
              const staffMembers = this.parseStaffMembers(subjectData.staff);
              staffMembers.forEach(staff => {
                const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
                this.teacherWorkload.set(staff.trim(), currentWorkload + 1);
              });
            }
            console.log(`✅ Allocated ${periodsInThisBlock} consecutive lab periods for ${subjectData.subject} in ${className} on ${this.getDayName(consecutiveSlots[0].day)}`);
            blockAllocated = true;
            break;
          }
        }
      }
      
      if (!blockAllocated) {
        console.warn(`Could not allocate consecutive block ${block + 1} for ${subjectData.subject} lab`);
        break;
      }
    }
    
    // If we still have unallocated periods, try individual allocation
    if (allocation.allocatedPeriods < allocation.requiredPeriods) {
      console.warn(`Lab ${subjectData.subject} still needs ${allocation.requiredPeriods - allocation.allocatedPeriods} more periods. Trying individual allocation.`);
      while (allocation.allocatedPeriods < allocation.requiredPeriods) {
        const slot = this.findBestSlotWithAntiRepetition(subjectData, className);
        if (slot) {
          this.assignLabSlotWithTracking(slot, subjectData, className);
          allocation.allocatedPeriods++;
          
          // Update workload for all lab staff members
          const staffMembers = this.parseStaffMembers(subjectData.staff);
          staffMembers.forEach(staff => {
            const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
            this.teacherWorkload.set(staff.trim(), currentWorkload + 1);
          });
        } else {
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

  private findBestSlotWithAntiRepetition(subjectData: SubjectData, className: string): { day: number, period: number } | null {
    const staffMembers = this.parseStaffMembers(subjectData.staff);
    const primaryStaff = staffMembers[0] || subjectData.staff;
    
    const teacherPreference = this.teacherPreferences.find(
      pref => pref.teacherName === primaryStaff
    );

    // Check if primary teacher has exceeded max periods per week
    const currentWorkload = this.teacherWorkload.get(primaryStaff) || 0;
    if (currentWorkload >= this.scheduleSettings.maxTeacherPeriodsPerWeek) {
      return null;
    }

    // Get periods already used by this subject-class combination (to prevent repetition across days)
    const subjectClassKey = `${subjectData.subject}-${className}`;
    const usedPeriods = this.subjectPeriodUsage.get(subjectClassKey) || new Set();

    // Priority 1: Try preferred slots first that don't use already used periods
    const preferredSlots = this.getPreferredSlots(subjectData, teacherPreference);
    for (const slot of preferredSlots) {
      if (!usedPeriods.has(slot.period + 1) && this.isSlotAvailableForAllStaff(slot.day, slot.period, className, staffMembers)) {
        return slot;
      }
    }

    // Priority 2: Find best available slot that avoids period repetition
    return this.findOptimalSlotWithAntiRepetition(className, primaryStaff, subjectClassKey, staffMembers);
  }

  private findOptimalSlotWithAntiRepetition(className: string, teacher: string, subjectClassKey: string, allStaffMembers?: string[]): { day: number, period: number } | null {
    const availableSlots: { day: number, period: number, score: number }[] = [];
    const usedPeriods = this.subjectPeriodUsage.get(subjectClassKey) || new Set();

    // Score all available slots
    for (let day = 0; day < 6; day++) {
      for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay; period++) {
        // Skip lunch and break periods
        if (period + 1 === this.scheduleSettings.lunchPeriod || 
            this.scheduleSettings.breakPeriods.includes(period + 1)) {
          continue;
        }

        const periodNumber = period + 1;
        
        // Skip periods already used by this subject-class combination (anti-repetition across days)
        if (usedPeriods.has(periodNumber)) {
          continue;
        }

        const staffToCheck = allStaffMembers || [teacher];
        if (this.isSlotAvailableForAllStaff(day, period, className, staffToCheck)) {
          let score = this.calculateSlotScore(day, period, className, teacher);
          
          // Bonus for avoiding period repetition across days
          score += 100;
          
          availableSlots.push({ day, period, score });
        }
      }
    }

    // Sort by score (higher is better) and return the best slot
    availableSlots.sort((a, b) => b.score - a.score);
    return availableSlots.length > 0 ? { day: availableSlots[0].day, period: availableSlots[0].period } : null;
  }

  private assignSlotWithTracking(slot: { day: number, period: number }, subjectData: SubjectData, className: string) {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return;

    const staffMembers = this.parseStaffMembers(subjectData.staff);
    
    const timeSlot: TimeSlot = {
      day: this.getDayName(slot.day),
      period: slot.period + 1,
      subject: subjectData.subject,
      staff: subjectData.staff,
      className
    };

    // Assign to class timetable
    classSchedule[slot.day][slot.period] = { ...timeSlot };

    // Assign to all staff members' timetables
    staffMembers.forEach(staff => {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (teacherSchedule) {
        const teacherTimeSlot: TimeSlot = {
          day: this.getDayName(slot.day),
          period: slot.period + 1,
          subject: subjectData.subject,
          staff: staff.trim(),
          className
        };
        teacherSchedule[slot.day][slot.period] = { ...teacherTimeSlot };
      }
    });

    // Track period usage for this subject-class combination (anti-repetition across days)
    const periodNumber = slot.period + 1;
    const subjectClassKey = `${subjectData.subject}-${className}`;
    const usedPeriods = this.subjectPeriodUsage.get(subjectClassKey) || new Set();
    usedPeriods.add(periodNumber);
    this.subjectPeriodUsage.set(subjectClassKey, usedPeriods);
  }

  private isSlotAvailableForAllStaff(day: number, period: number, className: string, staffMembers: string[]): boolean {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return false;

    // Check if class slot is free
    const classSlot = classSchedule[day][period];
    if (classSlot.subject) return false;

    // Check if all staff members are available
    for (const staff of staffMembers) {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (!teacherSchedule) continue;

      const teacherSlot = teacherSchedule[day][period];
      if (teacherSlot.subject) return false;
    }

    return true;
  }

  private isLabSlotAvailable(day: number, period: number, className: string, staffString: string): boolean {
    const staffMembers = this.parseStaffMembers(staffString);
    return this.isSlotAvailableForAllStaff(day, period, className, staffMembers);
  }

  private assignLabSlotWithTracking(slot: { day: number, period: number }, subjectData: SubjectData, className: string) {
    const classSchedule = this.classTimetables.get(className);
    if (!classSchedule) return;

    const staffMembers = this.parseStaffMembers(subjectData.staff);

    const timeSlot: TimeSlot = {
      day: this.getDayName(slot.day),
      period: slot.period + 1,
      subject: subjectData.subject,
      staff: subjectData.staff, // Keep the original staff string with all names
      className
    };

    // Assign to class timetable
    classSchedule[slot.day][slot.period] = { ...timeSlot };

    // Assign to each staff member's timetable
    staffMembers.forEach(staff => {
      const teacherSchedule = this.teacherTimetables.get(staff.trim());
      if (teacherSchedule) {
        const teacherTimeSlot: TimeSlot = {
          day: this.getDayName(slot.day),
          period: slot.period + 1,
          subject: subjectData.subject,
          staff: staff.trim(),
          className
        };
        teacherSchedule[slot.day][slot.period] = { ...teacherTimeSlot };
      }
    });

    // Track period usage for this subject-class combination (anti-repetition across days)
    const periodNumber = slot.period + 1;
    const subjectClassKey = `${subjectData.subject}-${className}`;
    const usedPeriods = this.subjectPeriodUsage.get(subjectClassKey) || new Set();
    usedPeriods.add(periodNumber);
    this.subjectPeriodUsage.set(subjectClassKey, usedPeriods);
  }

  private allocateGamesPeriods(subjectData: SubjectData, className: string) {
    const allocation = this.subjectAllocations.get(`${subjectData.subject}-${className}`);
    if (!allocation) return;

    const staffMembers = this.parseStaffMembers(subjectData.staff);
    
    // Try to allocate games periods at the last period of each day
    for (let day = 0; day < 6 && allocation.allocatedPeriods < allocation.requiredPeriods; day++) {
      const lastPeriod = this.scheduleSettings.totalPeriodsPerDay - 1;
      
      if (this.isSlotAvailableForAllStaff(day, lastPeriod, className, staffMembers)) {
        const slot = { day, period: lastPeriod };
        this.assignSlotWithTracking(slot, subjectData, className);
        allocation.allocatedPeriods++;
        
        staffMembers.forEach(staff => {
          const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
          this.teacherWorkload.set(staff.trim(), currentWorkload + 1);
        });
        
        console.log(`✅ Allocated games period for ${subjectData.subject} in ${className} on ${this.getDayName(day)} last period`);
      }
    }
  }

  private allocateLibraryPeriods(subjectData: SubjectData, className: string) {
    const allocation = this.subjectAllocations.get(`${subjectData.subject}-${className}`);
    if (!allocation) return;

    const staffMembers = this.parseStaffMembers(subjectData.staff);
    
    // For library periods, ensure only one class can use the library at a time
    while (allocation.allocatedPeriods < allocation.requiredPeriods) {
      let allocated = false;
      
      for (let day = 0; day < 6 && !allocated; day++) {
        for (let period = 0; period < this.scheduleSettings.totalPeriodsPerDay && !allocated; period++) {
          // Skip lunch and break periods
          if (period + 1 === this.scheduleSettings.lunchPeriod || 
              this.scheduleSettings.breakPeriods.includes(period + 1)) {
            continue;
          }
          
          const slotKey = `${day}-${period}`;
          
          // Check if library is free and staff is available
          if (!this.libraryOccupancy.has(slotKey) && 
              this.isSlotAvailableForAllStaff(day, period, className, staffMembers)) {
            
            const slot = { day, period };
            this.assignSlotWithTracking(slot, subjectData, className);
            this.libraryOccupancy.set(slotKey, className);
            allocation.allocatedPeriods++;
            allocated = true;
            
            staffMembers.forEach(staff => {
              const currentWorkload = this.teacherWorkload.get(staff.trim()) || 0;
              this.teacherWorkload.set(staff.trim(), currentWorkload + 1);
            });
            
            console.log(`✅ Allocated library period for ${subjectData.subject} in ${className} on ${this.getDayName(day)} period ${period + 1}`);
          }
        }
      }
      
      if (!allocated) {
        console.warn(`Could not allocate library period for ${subjectData.subject} in ${className}`);
        break;
      }
    }
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