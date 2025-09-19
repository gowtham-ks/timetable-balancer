-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  periods_per_week INTEGER NOT NULL,
  staff_name TEXT NOT NULL,
  preferred_day TEXT,
  preferred_period INTEGER,
  preferred_slots TEXT,
  subject_type TEXT DEFAULT 'regular' CHECK (subject_type IN ('regular', 'lab', 'library', 'games')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL DEFAULT 'regular' CHECK (room_type IN ('regular', 'lab', 'library')),
  capacity INTEGER NOT NULL DEFAULT 30,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period_number INTEGER NOT NULL CHECK (period_number >= 1 AND period_number <= 8),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  staff_name TEXT,
  is_break BOOLEAN DEFAULT FALSE,
  break_type TEXT CHECK (break_type IN ('short_break', 'lunch_break', 'assembly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_name, day_of_week, period_number)
);

-- Create teacher preferences table
CREATE TABLE public.teacher_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_name TEXT NOT NULL,
  department TEXT,
  preferred_day TEXT NOT NULL CHECK (preferred_day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  preferred_period INTEGER NOT NULL CHECK (preferred_period >= 1 AND preferred_period <= 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule settings table
CREATE TABLE public.schedule_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_periods_per_day INTEGER NOT NULL DEFAULT 7,
  lunch_period INTEGER NOT NULL DEFAULT 4,
  break_periods INTEGER[] DEFAULT ARRAY[2, 6],
  max_teacher_periods_per_week INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects (Admins can manage, others can view)
CREATE POLICY "Everyone can view subjects" 
ON public.subjects 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage subjects" 
ON public.subjects 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classrooms
CREATE POLICY "Everyone can view classrooms" 
ON public.classrooms 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage classrooms" 
ON public.classrooms 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for timetables
CREATE POLICY "Everyone can view timetables" 
ON public.timetables 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage timetables" 
ON public.timetables 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teacher preferences
CREATE POLICY "Teachers can view their own preferences" 
ON public.teacher_preferences 
FOR SELECT 
USING (
  teacher_name = (SELECT full_name FROM public.profiles WHERE user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Teachers can manage their own preferences" 
ON public.teacher_preferences 
FOR ALL 
USING (
  teacher_name = (SELECT full_name FROM public.profiles WHERE user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for schedule settings
CREATE POLICY "Everyone can view schedule settings" 
ON public.schedule_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage schedule settings" 
ON public.schedule_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_settings_updated_at
  BEFORE UPDATE ON public.schedule_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default schedule settings
INSERT INTO public.schedule_settings (
  total_periods_per_day,
  lunch_period,
  break_periods,
  max_teacher_periods_per_week
) VALUES (
  7,
  4,
  ARRAY[2, 6],
  30
);

-- Insert some default classrooms
INSERT INTO public.classrooms (room_number, room_type, capacity, department) VALUES
('101', 'regular', 40, 'Computer Science'),
('102', 'regular', 40, 'Computer Science'),
('103', 'lab', 30, 'Computer Science'),
('201', 'regular', 40, 'Electronics'),
('202', 'regular', 40, 'Electronics'),
('203', 'lab', 30, 'Electronics'),
('301', 'regular', 40, 'Mechanical'),
('302', 'regular', 40, 'Mechanical'),
('303', 'lab', 30, 'Mechanical'),
('Library', 'library', 100, 'General'),
('Playground', 'regular', 200, 'Sports');