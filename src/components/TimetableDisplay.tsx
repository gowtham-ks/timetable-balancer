import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClassTimetable, TeacherTimetable } from '@/types/timetable';

interface TimetableDisplayProps {
  classTimetables: ClassTimetable[];
  teacherTimetables: TeacherTimetable[];
  totalPeriodsPerDay: number;
  lunchPeriod: number;
  breakPeriods: number[];
}

export const TimetableDisplay: React.FC<TimetableDisplayProps> = ({
  classTimetables,
  teacherTimetables,
  totalPeriodsPerDay,
  lunchPeriod,
  breakPeriods,
}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = Array.from({ length: totalPeriodsPerDay }, (_, i) => i + 1);

  const isBreakPeriod = (period: number) => {
    return period === lunchPeriod || breakPeriods.includes(period);
  };

  const getBreakLabel = (period: number) => {
    if (period === lunchPeriod) return 'Lunch';
    if (breakPeriods.includes(period)) return 'Break';
    return '';
  };

  const renderClassTimetable = (classData: ClassTimetable) => (
    <Card key={classData.className} className="card-gradient shadow-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg gradient-text">
          {classData.className}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-2 bg-secondary text-secondary-foreground font-medium">
                  Period / Day
                </th>
                {days.map(day => (
                  <th key={day} className="border border-border p-2 bg-secondary text-secondary-foreground font-medium min-w-32">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td className="border border-border p-2 bg-muted text-muted-foreground font-medium text-center">
                    {period}
                  </td>
                  {days.map((day, dayIndex) => {
                    const slot = classData.schedule[dayIndex][period - 1];
                    
                    if (isBreakPeriod(period)) {
                      return (
                        <td key={day} className="border border-border p-2 bg-warning/10 text-center">
                          <Badge variant="outline" className="bg-warning/20 text-warning-foreground">
                            {getBreakLabel(period)}
                          </Badge>
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="border border-border p-1 text-center">
                        {slot.subject ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-primary">
                              {slot.subject}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {slot.staff}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground py-4">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderTeacherTimetable = (teacherData: TeacherTimetable) => (
    <Card key={teacherData.teacherName} className="card-gradient shadow-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg gradient-text">
          {teacherData.teacherName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-2 bg-secondary text-secondary-foreground font-medium">
                  Period / Day
                </th>
                {days.map(day => (
                  <th key={day} className="border border-border p-2 bg-secondary text-secondary-foreground font-medium min-w-32">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period}>
                  <td className="border border-border p-2 bg-muted text-muted-foreground font-medium text-center">
                    {period}
                  </td>
                  {days.map((day, dayIndex) => {
                    const slot = teacherData.schedule[dayIndex][period - 1];
                    
                    if (isBreakPeriod(period)) {
                      return (
                        <td key={day} className="border border-border p-2 bg-warning/10 text-center">
                          <Badge variant="outline" className="bg-warning/20 text-warning-foreground">
                            {getBreakLabel(period)}
                          </Badge>
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="border border-border p-1 text-center">
                        {slot.subject ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-primary">
                              {slot.subject}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {slot.className}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground py-4">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {classTimetables.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-text">Class Timetables</h2>
          <div className="grid gap-6">
            {classTimetables.map(renderClassTimetable)}
          </div>
        </div>
      )}

      {teacherTimetables.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-text">Teacher Timetables</h2>
          <div className="grid gap-6">
            {teacherTimetables.map(renderTeacherTimetable)}
          </div>
        </div>
      )}
    </div>
  );
};