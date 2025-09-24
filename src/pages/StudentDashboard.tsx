import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { Calendar, BookOpen, Clock, GraduationCap, Search, CheckCircle, Users } from "lucide-react";
import type { 
  ScheduleSettings, 
  ClassTimetable 
} from "@/types/timetable";

interface StudentDashboardProps {
  scheduleSettings: ScheduleSettings;
  classTimetables: ClassTimetable[];
}

const StudentDashboard = ({
  scheduleSettings,
  classTimetables
}: StudentDashboardProps) => {
  const [searchClass, setSearchClass] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Get unique class names
  const availableClasses = useMemo(() => {
    return Array.from(new Set(classTimetables.map(ct => ct.className))).sort();
  }, [classTimetables]);

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    if (!searchClass) return availableClasses;
    return availableClasses.filter(className =>
      className.toLowerCase().includes(searchClass.toLowerCase())
    );
  }, [availableClasses, searchClass]);

  // Get selected class timetable
  const selectedClassTimetable = useMemo(() => {
    if (!selectedClass) return [];
    return classTimetables.filter(ct => ct.className === selectedClass);
  }, [classTimetables, selectedClass]);

  // Calculate class statistics
  const stats = useMemo(() => {
    const totalClasses = classTimetables.length;
    let totalSubjects = new Set<string>();
    let totalPeriods = 0;

    classTimetables.forEach(ct => {
      ct.schedule.forEach(day => {
        day.forEach(period => {
          if (period.subject && period.subject !== 'Break' && period.subject !== 'Lunch') {
            totalSubjects.add(period.subject);
            totalPeriods++;
          }
        });
      });
    });

    return {
      totalClasses,
      subjectsCount: totalSubjects.size,
      averagePeriodsPerClass: totalClasses > 0 ? Math.round(totalPeriods / totalClasses) : 0
    };
  }, [classTimetables]);

  return (
    <>
      {/* Student Header */}
      <div className="relative overflow-hidden mb-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-12 w-12 text-green-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              Student Portal
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            Access your class timetables and academic schedules • Stay organized with your studies
          </p>
          
          {/* Academic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-8 w-8 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{stats.totalClasses}</span>
                </div>
                <p className="text-sm text-muted-foreground">Available Classes</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{stats.subjectsCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-8 w-8 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">{stats.averagePeriodsPerClass}</span>
                </div>
                <p className="text-sm text-muted-foreground">Avg. Periods/Class</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        
        {/* Class Search */}
        {availableClasses.length > 0 && (
          <Card className="border-green-500/20">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Search className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Find Your Class</CardTitle>
                  <CardDescription>Search and select your class to view the timetable</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-search">Search Classes</Label>
                  <Input
                    id="class-search"
                    placeholder="Enter your class name (e.g., 10A, 12-Science, etc.)"
                    value={searchClass}
                    onChange={(e) => setSearchClass(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredClasses.map((className) => (
                    <Button
                      key={className}
                      variant={selectedClass === className ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center gap-2 ${
                        selectedClass === className 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "border-green-500/20 hover:bg-green-500/10"
                      }`}
                      onClick={() => setSelectedClass(className)}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium">{className}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Class Timetable */}
        {selectedClass && selectedClassTimetable.length > 0 && (
          <Card className="border-green-500/20">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Class {selectedClass} Timetable</CardTitle>
                  <CardDescription>Your class schedule for the week</CardDescription>
                </div>
                <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TimetableDisplay 
                classTimetables={selectedClassTimetable}
                teacherTimetables={[]}
                totalPeriods={scheduleSettings.totalPeriodsPerDay}
                lunchPeriod={scheduleSettings.lunchPeriod}
                breakPeriods={scheduleSettings.breakPeriods || []}
              />
            </CardContent>
          </Card>
        )}

        {/* All Classes Overview */}
        {!selectedClass && classTimetables.length > 0 && (
          <Card className="border-green-500/20">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl">All Class Timetables</CardTitle>
                  <CardDescription>Browse all available class schedules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TimetableDisplay 
                classTimetables={classTimetables}
                teacherTimetables={[]}
                totalPeriods={scheduleSettings.totalPeriodsPerDay}
                lunchPeriod={scheduleSettings.lunchPeriod}
                breakPeriods={scheduleSettings.breakPeriods || []}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {classTimetables.length === 0 && (
          <Card className="border-dashed border-2 border-green-500/25">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                <GraduationCap className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Timetables Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Class timetables haven't been generated yet. Please check back later or contact your school administration.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Ready to access timetables once available</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        {classTimetables.length > 0 && (
          <Card className="border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Academic Information</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Updated
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Timetables are regularly updated to reflect any changes in the academic schedule. 
                Make sure to check for the latest version before planning your study schedule.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;