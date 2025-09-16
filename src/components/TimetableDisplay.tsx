import { ClassTimetable, TeacherTimetable } from '@/types/timetable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface TimetableDisplayProps {
  classTimetables: ClassTimetable[];
  teacherTimetables: TeacherTimetable[];
  totalPeriods: number;
  lunchPeriod: number;
  breakPeriods: number[];
}

export const TimetableDisplay = ({ 
  classTimetables, 
  teacherTimetables, 
  totalPeriods, 
  lunchPeriod, 
  breakPeriods 
}: TimetableDisplayProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = Array.from({ length: totalPeriods }, (_, i) => i + 1);

  const isBreakPeriod = (period: number) => {
    return period === lunchPeriod || breakPeriods.includes(period);
  };

  const getBreakLabel = (period: number) => {
    if (period === lunchPeriod) return 'Lunch';
    if (breakPeriods.includes(period)) return 'Break';
    return '';
  };

  const renderClassTimetable = (classData: ClassTimetable) => (
    <Card key={classData.className} className="card-gradient shadow-card animate-fade-in pulse-glow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg gradient-text floating">
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
                <tr key={period} className="hover:bg-muted/5 transition-colors">
                  <td className="border border-border p-2 bg-muted text-muted-foreground font-medium text-center">
                    {period}
                  </td>
                  {days.map((day, dayIndex) => {
                    // Safe access to schedule with fallbacks
                    const daySchedule = classData.schedule?.[dayIndex] || [];
                    const slot = daySchedule[period - 1];
                    
                    if (isBreakPeriod(period)) {
                      return (
                        <td key={day} className="border border-border p-2 bg-warning/10 text-center">
                          <Badge variant="outline" className="bg-warning/20 text-warning-foreground animate-pulse">
                            {getBreakLabel(period)}
                          </Badge>
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="border border-border p-1 text-center">
                        {slot?.subject ? (
                          <div className="space-y-1 hover-scale">
                            <div className="text-sm font-medium text-primary animate-fade-in">
                              {slot.subject}
                            </div>
                            {slot.staff && (
                              <div className="text-xs text-muted-foreground">
                                {slot.staff}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground/50">
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
    <Card key={teacherData.teacherName} className="card-gradient shadow-card animate-fade-in pulse-glow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg gradient-text floating">
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
                <tr key={period} className="hover:bg-muted/5 transition-colors">
                  <td className="border border-border p-2 bg-muted text-muted-foreground font-medium text-center">
                    {period}
                  </td>
                  {days.map((day, dayIndex) => {
                    // Safe access to schedule with fallbacks
                    const daySchedule = teacherData.schedule?.[dayIndex] || [];
                    const slot = daySchedule[period - 1];
                    
                    if (isBreakPeriod(period)) {
                      return (
                        <td key={day} className="border border-border p-2 bg-warning/10 text-center">
                          <Badge variant="outline" className="bg-warning/20 text-warning-foreground animate-pulse">
                            {getBreakLabel(period)}
                          </Badge>
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="border border-border p-1 text-center">
                        {slot?.subject ? (
                          <div className="space-y-1 hover-scale">
                            <div className="text-sm font-medium text-primary animate-fade-in">
                              {slot.subject}
                            </div>
                            {slot.className && (
                              <div className="text-xs text-muted-foreground">
                                {slot.className}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground/50">
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
        <section className="space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold gradient-text floating flex items-center gap-3">
            <span className="text-4xl">📅</span>
            Class Timetables
          </h2>
          <div className="space-y-6">
            {classTimetables.map((timetable, index) => (
              <div 
                key={timetable.className} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {renderClassTimetable(timetable)}
              </div>
            ))}
          </div>
        </section>
      )}

      {teacherTimetables.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold gradient-text floating flex items-center gap-3">
            <span className="text-4xl">👨‍🏫</span>
            Teacher Timetables
          </h2>
          <div className="space-y-6">
            {teacherTimetables.map((timetable, index) => (
              <div 
                key={timetable.teacherName} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {renderTeacherTimetable(timetable)}
              </div>
            ))}
          </div>
        </section>
      )}

      {classTimetables.length === 0 && teacherTimetables.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <div className="space-y-4">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-muted-foreground">
              No Timetables Generated Yet
            </h3>
            <p className="text-muted-foreground">
              Generate timetables to see them displayed here with beautiful animations and layouts
            </p>
          </div>
        </div>
      )}
    </div>
  );
};