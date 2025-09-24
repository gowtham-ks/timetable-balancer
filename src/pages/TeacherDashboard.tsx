import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { Calendar, Users, BookOpen, Clock, User, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { 
  ScheduleSettings, 
  ClassTimetable, 
  TeacherTimetable 
} from "@/types/timetable";

interface TeacherDashboardProps {
  scheduleSettings: ScheduleSettings;
  classTimetables: ClassTimetable[];
  teacherTimetables: TeacherTimetable[];
}

const TeacherDashboard = ({
  scheduleSettings,
  classTimetables,
  teacherTimetables
}: TeacherDashboardProps) => {
  const { profile } = useAuth();

  // Filter teacher's timetables
  const myTimetables = useMemo(() => {
    return teacherTimetables.filter(tt => 
      tt.teacherName.toLowerCase() === profile?.full_name?.toLowerCase()
    );
  }, [teacherTimetables, profile?.full_name]);

  // Filter classes where teacher is assigned
  const myClasses = useMemo(() => {
    return classTimetables.filter(ct =>
      ct.schedule.some(day => 
        day.some(period => 
          period.staff?.toLowerCase() === profile?.full_name?.toLowerCase()
        )
      )
    );
  }, [classTimetables, profile?.full_name]);

  // Calculate teaching statistics
  const stats = useMemo(() => {
    let totalPeriods = 0;
    let uniqueSubjects = new Set<string>();
    let uniqueClasses = new Set<string>();

    myTimetables.forEach(tt => {
      tt.schedule.forEach(day => {
        day.forEach(period => {
          if (period.subject && period.subject !== 'Break' && period.subject !== 'Lunch') {
            totalPeriods++;
            uniqueSubjects.add(period.subject);
            if (period.className) {
              uniqueClasses.add(period.className);
            }
          }
        });
      });
    });

    return {
      totalPeriods,
      subjectsCount: uniqueSubjects.size,
      classesCount: uniqueClasses.size
    };
  }, [myTimetables]);

  return (
    <>
      {/* Teacher Header */}
      <div className="relative overflow-hidden mb-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="h-12 w-12 text-blue-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              Teacher Dashboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            Welcome back, {profile?.full_name} • View your personalized teaching schedule
          </p>
          
          {/* Teaching Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">{stats.totalPeriods}</span>
                </div>
                <p className="text-sm text-muted-foreground">Weekly Periods</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">{stats.subjectsCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Subjects Teaching</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-500">{stats.classesCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Classes Assigned</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        
        {/* My Schedule */}
        {myTimetables.length > 0 && (
          <Card className="border-blue-500/20">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">My Teaching Schedule</CardTitle>
                  <CardDescription>Your personalized weekly timetable</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TimetableDisplay 
                classTimetables={[]}
                teacherTimetables={myTimetables}
                totalPeriods={scheduleSettings.totalPeriodsPerDay}
                lunchPeriod={scheduleSettings.lunchPeriod}
                breakPeriods={scheduleSettings.breakPeriods || []}
              />
            </CardContent>
          </Card>
        )}

        {/* My Classes */}
        {myClasses.length > 0 && (
          <Card className="border-blue-500/20">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Classes I Teach</CardTitle>
                  <CardDescription>Timetables for your assigned classes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TimetableDisplay 
                classTimetables={myClasses}
                teacherTimetables={[]}
                totalPeriods={scheduleSettings.totalPeriodsPerDay}
                lunchPeriod={scheduleSettings.lunchPeriod}
                breakPeriods={scheduleSettings.breakPeriods || []}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {myTimetables.length === 0 && myClasses.length === 0 && (
          <Card className="border-dashed border-2 border-blue-500/25">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10">
                <User className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Schedule Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Your teaching schedule hasn't been generated yet. Please contact your administrator to generate the timetables.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Ready to view schedule once generated</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Status */}
        {(myTimetables.length > 0 || myClasses.length > 0) && (
          <Card className="border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Schedule Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your teaching schedule is up to date. If you notice any conflicts or need changes, 
                please contact your administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default TeacherDashboard;