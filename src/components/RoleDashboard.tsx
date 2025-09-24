import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/AdminDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import type { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings, 
  ClassTimetable, 
  TeacherTimetable 
} from "@/types/timetable";

const RoleDashboard = () => {
  const { profile } = useAuth();
  
  // Core state management
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreference[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    totalPeriodsPerDay: 10,
    lunchPeriod: 6,
    breakPeriods: [3, 9],
    maxTeacherPeriodsPerWeek: 25,
  });
  
  const [classTimetables, setClassTimetables] = useState<ClassTimetable[]>([]);
  const [teacherTimetables, setTeacherTimetables] = useState<TeacherTimetable[]>([]);

  // Render appropriate dashboard based on user role
  if (profile?.role === 'admin') {
    return (
      <AdminDashboard
        subjectData={subjectData}
        setSubjectData={setSubjectData}
        teacherPreferences={teacherPreferences}
        setTeacherPreferences={setTeacherPreferences}
        scheduleSettings={scheduleSettings}
        setScheduleSettings={setScheduleSettings}
        classTimetables={classTimetables}
        setClassTimetables={setClassTimetables}
        teacherTimetables={teacherTimetables}
        setTeacherTimetables={setTeacherTimetables}
      />
    );
  }

  if (profile?.role === 'teacher') {
    return (
      <TeacherDashboard
        scheduleSettings={scheduleSettings}
        classTimetables={classTimetables}
        teacherTimetables={teacherTimetables}
      />
    );
  }

  if (profile?.role === 'student') {
    return (
      <StudentDashboard
        scheduleSettings={scheduleSettings}
        classTimetables={classTimetables}
      />
    );
  }

  // Fallback - should not happen
  return null;
};

export default RoleDashboard;