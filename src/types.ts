export interface User {
  id: number;
  name: string;
  email: string;
  is_first_gen: number;
  class_year: string;
  stream: string;
  preferences: string; // JSON string
  profile_pic?: string;
  progress?: Progress;
}

export interface Progress {
  tasks_completed: number;
  streak: number;
  points: number;
  last_active: string;
}

export interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export interface StudyPlan {
  id: number;
  subject: string;
  difficulty: string;
  plan_json: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    notes: string[];
    questions: string[];
  };
}

export interface CareerRoadmap {
  id: number;
  user_id: number;
  stream: string;
  goal: string;
  roadmap_json: {
    steps: {
      title: string;
      description: string;
      duration: string;
      skills: string[];
    }[];
    resources: string[];
  };
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  due_date: string;
  completed: number;
}
