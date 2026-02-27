import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  BookOpen, 
  LayoutDashboard, 
  MessageSquare, 
  Trophy, 
  User as UserIcon, 
  GraduationCap, 
  Search,
  ChevronRight,
  Send,
  Loader2,
  Map,
  Briefcase,
  ExternalLink,
  LogOut,
  Target,
  CheckCircle2,
  Flame,
  Calendar,
  Trash2,
  Clock,
  Bell,
  BarChart3,
  Settings,
  Globe,
  Download,
  HelpCircle,
  Star,
  Share2,
  Languages
} from 'lucide-react';
import { User, StudyPlan, CareerRoadmap, Task, Notification } from './types';
import { generateStudyPlan, solveDoubt, getMotivationalQuote, generateCareerRoadmap } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Hooks ---

const useTasks = (userId: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetch(`/api/tasks/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json();
      })
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => console.error(err));

    // WebSocket sync
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}?userId=${userId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'TASK_CREATED':
          setTasks(prev => [...prev, data.task]);
          break;
        case 'TASK_UPDATED':
          setTasks(prev => prev.map(t => t.id === data.task.id ? data.task : t));
          break;
        case 'TASK_DELETED':
          setTasks(prev => prev.filter(t => t.id !== data.taskId));
          break;
      }
    };

    return () => ws.close();
  }, [userId]);

  const addTask = async (title: string, dueDate: string) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, dueDate })
    });
    if (!res.ok) throw new Error('Failed to add task');
    return res.json();
  };

  const toggleTask = async (taskId: number, completed: boolean) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  };

  const deleteTask = async (taskId: number) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  return { tasks, loading, addTask, toggleTask, deleteTask };
};

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'outline' }) => {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200 shadow-sm',
    secondary: 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300',
    ghost: 'hover:bg-slate-100 text-slate-600',
    outline: 'border-2 border-brand-600 text-brand-600 hover:bg-brand-50 hover:border-brand-700'
  };
  
  // Omit potential conflicting props for motion.button
  const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...safeProps } = props as any;

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2', variants[variant], className)} 
      {...safeProps} 
    />
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className={cn('glass-card p-6', className)} 
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// --- Screens ---

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isFirstGen: true,
    classYear: '1st Year',
    stream: 'Engineering'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Signup failed');
      const user = await res.json();
      onLogin(user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 to-white overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-200"
          >
            <GraduationCap className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-slate-900">StudyMate</h1>
          <p className="text-slate-500 mt-2">Your personalized learning companion</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-slate-50/50"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Threyaa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-slate-50/50"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
              />
            </div>
            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox"
                id="firstgen"
                checked={formData.isFirstGen}
                onChange={e => setFormData({...formData, isFirstGen: e.target.checked})}
                className="w-5 h-5 rounded-lg text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="firstgen" className="text-sm text-slate-700 font-medium">I am a first-generation student</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50/50"
                  value={formData.classYear}
                  onChange={e => setFormData({...formData, classYear: e.target.value})}
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stream</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none bg-slate-50/50"
                  value={formData.stream}
                  onChange={e => setFormData({...formData, stream: e.target.value})}
                >
                  <option>Engineering</option>
                  <option>Science</option>
                  <option>Commerce</option>
                  <option>Arts</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full py-4 mt-4 text-lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Get Started'}
            </Button>
          </form>
        </Card>
      </motion.div>
      <div className="fixed bottom-4 right-6 text-slate-400 text-[15px] font-normal z-50 pointer-events-none">
        Developed by Future Founders
      </div>
    </div>
  );
};

const TaskSection = ({ userId }: { userId: number }) => {
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks(userId);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    await addTask(newTaskTitle, newTaskDate);
    setNewTaskTitle('');
  };

  return (
    <Card className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display flex items-center gap-2">
          <Calendar size={20} className="text-brand-600" />
          Tasks & Deadlines
        </h3>
      </div>

      <form onSubmit={handleAddTask} className="flex flex-col gap-2">
        <input 
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          placeholder="What needs to be done?"
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
            type="date"
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            value={newTaskDate}
            onChange={e => setNewTaskDate(e.target.value)}
          />
          <Button type="submit" className="shrink-0 px-6">
            Add
          </Button>
        </div>
      </form>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : tasks.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-slate-400 py-8 text-sm italic"
            >
              No tasks yet. Stay organized!
            </motion.p>
          ) : (
            tasks.map(task => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  task.completed ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-100 hover:border-brand-200"
                )}
              >
                <motion.button 
                  whileTap={{ scale: 0.8 }}
                  onClick={() => toggleTask(task.id, !task.completed)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    task.completed ? "bg-brand-600 border-brand-600 text-white" : "border-slate-200 hover:border-brand-500"
                  )}
                >
                  {task.completed && <CheckCircle2 size={14} />}
                </motion.button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", task.completed && "line-through text-slate-400")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Clock size={10} />
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, color: '#ef4444' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-300 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

const Dashboard = ({ user, setView }: { user: User; setView: (v: string) => void }) => {
  const [quote, setQuote] = useState("Loading your daily motivation...");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshingQuote, setRefreshingQuote] = useState(false);
  const prefs = JSON.parse(user.preferences || '{"language": "English"}');

  const refreshQuote = async () => {
    setRefreshingQuote(true);
    try {
      const newQuote = await getMotivationalQuote();
      setQuote(newQuote);
    } finally {
      setRefreshingQuote(false);
    }
  };

  useEffect(() => {
    refreshQuote();
    fetch(`/api/notifications/${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      })
      .then(setNotifications)
      .catch(err => console.error(err));
  }, [user.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-start sticky top-0 bg-slate-50/80 backdrop-blur-md z-30 py-4 -mx-4 px-4">
        <div>
          <h1 className="text-2xl font-display">
            Hi, {user.name} 
            <motion.span
              animate={{ rotate: [0, 20, 0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
              className="inline-block ml-1"
            >
              👋
            </motion.span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 italic text-sm line-clamp-1">"{quote}"</p>
            <button 
              onClick={refreshQuote} 
              className={cn("text-slate-400 hover:text-brand-600 transition-all", refreshingQuote && "animate-spin")}
              title="Refresh Quote"
            >
              <Globe size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-brand-300 transition-all relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <span className="font-bold text-sm">Notifications</span>
                    <button className="text-xs text-brand-600 hover:underline">Mark all as read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">No notifications yet</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={cn("p-4 border-b last:border-0 hover:bg-slate-50 transition-colors", !n.is_read && "bg-brand-50/30")}>
                          <p className="text-sm text-slate-700">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl text-sm font-bold border border-brand-100">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            {user.progress?.points || 0}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card className="h-full cursor-pointer hover:border-brand-500 group" onClick={() => setView('study-plan')}>
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-base mb-1">Study Plan</h3>
                <p className="text-xs text-slate-500 line-clamp-2">AI-generated weekly roadmap.</p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card className="h-full cursor-pointer hover:border-brand-500 group" onClick={() => setView('doubts')}>
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-base mb-1">Ask AI</h3>
                <p className="text-xs text-slate-500 line-clamp-2">Simple explanations for you.</p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card className="h-full cursor-pointer hover:border-brand-500 group" onClick={() => setView('career-roadmap')}>
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Map size={20} />
                </div>
                <h3 className="text-base mb-1">Career</h3>
                <p className="text-xs text-slate-500 line-clamp-2">Path to your dream job.</p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Card className="h-full cursor-pointer hover:border-brand-500 group" onClick={() => setView('analytics')}>
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-base mb-1">Insights</h3>
                <p className="text-xs text-slate-500 line-clamp-2">Track your learning journey.</p>
              </Card>
            </motion.div>
          </div>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy size={80} />
            </div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg">Daily Goal</h3>
              <span className="text-sm font-bold text-brand-600">{user.progress?.tasks_completed || 0}/10 Tasks</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((user.progress?.tasks_completed || 0) / 10) * 100, 100)}%` }}
                className="bg-brand-600 h-full" 
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">You're on a {user.progress?.streak || 0} day streak! 🔥</p>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <TaskSection userId={user.id} />
        </div>
      </div>
    </div>
  );
};

const StudyPlanView = ({ user }: { user: User }) => {
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const { addTask } = useTasks(user.id);
  const prefs = JSON.parse(user.preferences || '{"language": "English"}');

  useEffect(() => {
    fetch(`/api/study-plans/${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch study plans');
        return res.json();
      })
      .then(setPlans)
      .catch(err => console.error(err));
  }, [user.id]);

  const handleAddToTasks = async (topic: string) => {
    const today = new Date().toISOString().split('T')[0];
    await addTask(topic, today);
    alert('Added to your daily tasks!');
  };

  const handleExport = () => {
    if (!activePlan) return;
    const text = `
Study Plan: ${activePlan.subject}
Difficulty: ${activePlan.difficulty}

Weekly Schedule:
${Object.entries(activePlan.plan_json).filter(([k]) => !['notes', 'questions'].includes(k)).map(([day, topic]) => `${day}: ${topic}`).join('\n')}

Simplified Notes:
${activePlan.plan_json.notes.join('\n')}

Practice Questions:
${activePlan.plan_json.questions.join('\n')}
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlan.subject}_study_plan.txt`;
    a.click();
  };

  const handleGenerate = async () => {
    if (!subject) return;
    setLoading(true);
    try {
      const planData = await generateStudyPlan(subject, difficulty, user.stream, prefs.language);
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject,
          difficulty,
          planJson: planData
        })
      });
      if (!res.ok) throw new Error('Failed to save study plan');
      const { id } = await res.json();
      const newPlan = { id, subject, difficulty, plan_json: planData };
      setPlans([newPlan, ...plans]);
      setActivePlan(newPlan);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate study plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setActivePlan(null)} className={cn(!activePlan && 'hidden')}>
            Back to List
          </Button>
          <h1 className="text-2xl">Study Plans</h1>
        </div>
        {activePlan && (
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download size={18} /> Export
          </Button>
        )}
      </div>

      {!activePlan ? (
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4">Generate New Plan</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none"
                placeholder="Enter Subject (e.g., Data Structures)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <select 
                className="px-4 py-2 rounded-xl border border-slate-200 outline-none"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>Generate</>}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <Card 
                key={plan.id} 
                className="cursor-pointer hover:border-brand-500 transition-colors"
                onClick={() => setActivePlan(plan)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg">{plan.subject}</h4>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                      {plan.difficulty}
                    </span>
                  </div>
                  <ChevronRight className="text-slate-300" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl">{activePlan.subject} Roadmap</h2>
              <span className="text-sm text-slate-500">Difficulty: {activePlan.difficulty}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-brand-600 flex items-center gap-2">
                  <Target size={18} /> Weekly Schedule
                </h4>
                {Object.entries(activePlan.plan_json).filter(([k]) => k !== 'notes' && k !== 'questions').map(([day, topic]) => (
                  <div key={day} className="flex gap-4 items-start group">
                    <div className="w-24 text-xs font-bold uppercase text-slate-400 mt-1">{day}</div>
                    <div className="flex-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                      <span>{topic as string}</span>
                      <button 
                        onClick={() => handleAddToTasks(topic as string)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-600 hover:text-brand-700"
                        title="Add to Daily Tasks"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-brand-600 flex items-center gap-2">
                    <BookOpen size={18} /> Simplified Notes
                  </h4>
                  <ul className="space-y-2">
                    {activePlan.plan_json.notes.map((note, i) => (
                      <li key={i} className="text-sm flex gap-2 items-start">
                        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-brand-600 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Practice Questions
                  </h4>
                  <ul className="space-y-2">
                    {activePlan.plan_json.questions.map((q, i) => (
                      <li key={i} className="text-sm p-3 bg-brand-50 rounded-xl border border-brand-100 text-brand-700">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

const DoubtsView = ({ user }: { user: User }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const prefs = JSON.parse(user.preferences || '{"language": "English"}');

  const handleSend = async () => {
    if (!input || loading) return;
    const userMsg = input;
    setInput('');
    setMessages([...messages, { role: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const aiResponse = await solveDoubt(userMsg, messages.slice(-2).map(m => m.text).join('\n'), prefs.language);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse || "Sorry, I couldn't process that." }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having a bit of trouble connecting to my brain right now. " + (err.message || "Please try again in a moment.") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <h1 className="text-2xl mb-4">Ask AI Doubt</h1>
      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>Ask me anything! I'll explain it simply.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Explain Quantum Physics', 'What is a variable?', 'How to manage time?'].map(q => (
                  <button 
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] p-4 rounded-2xl text-sm',
                m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
              )}>
                <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown>
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                <Loader2 className="animate-spin text-slate-400" size={18} />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-slate-50">
          <div className="flex gap-2">
            <input 
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend} disabled={loading}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CareerRoadmapView = ({ user }: { user: User }) => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<CareerRoadmap | null>(null);
  const prefs = JSON.parse(user.preferences || '{"language": "English"}');

  useEffect(() => {
    fetch(`/api/career-roadmaps/${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch roadmaps');
        return res.json();
      })
      .then(setRoadmaps)
      .catch(err => console.error(err));
  }, [user.id]);

  const handleGenerate = async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const roadmapData = await generateCareerRoadmap(user.stream, goal, prefs.language);
      const res = await fetch('/api/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          stream: user.stream,
          goal,
          roadmapJson: roadmapData
        })
      });
      if (!res.ok) throw new Error('Failed to save roadmap');
      const { id } = await res.json();
      const newRoadmap = { id, user_id: user.id, stream: user.stream, goal, roadmap_json: roadmapData };
      setRoadmaps([newRoadmap, ...roadmaps]);
      setActiveRoadmap(newRoadmap);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate career roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!activeRoadmap) return;
    const text = `
Career Roadmap: ${activeRoadmap.goal}
Stream: ${activeRoadmap.stream}

Steps:
${activeRoadmap.roadmap_json.steps.map((step, i) => `${i + 1}. ${step.title} (${step.duration})\n   ${step.description}\n   Skills: ${step.skills.join(', ')}`).join('\n\n')}

Resources:
${activeRoadmap.roadmap_json.resources.join('\n')}
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeRoadmap.goal}_roadmap.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setActiveRoadmap(null)} className={cn(!activeRoadmap && 'hidden')}>
            Back to List
          </Button>
          <h1 className="text-2xl">Career Roadmaps</h1>
        </div>
        {activeRoadmap && (
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download size={18} /> Export
          </Button>
        )}
      </div>

      {!activeRoadmap ? (
        <div className="space-y-6">
          <Card>
            <h3 className="mb-4">Where do you want to be?</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter your dream job (e.g., Software Engineer at Google)"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>Generate Roadmap</>}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmaps.map(roadmap => (
              <Card 
                key={roadmap.id} 
                className="cursor-pointer hover:border-brand-500 transition-colors"
                onClick={() => setActiveRoadmap(roadmap)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg">{roadmap.goal}</h4>
                    <p className="text-xs text-slate-500 mt-1">Stream: {roadmap.stream}</p>
                  </div>
                  <ChevronRight className="text-slate-300" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="space-y-8">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-display text-brand-700">{activeRoadmap.goal}</h2>
              <p className="text-slate-500">Your step-by-step path to success</p>
            </div>

            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {activeRoadmap.roadmap_json.steps.map((step, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-brand-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    {i + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-900">{step.title}</div>
                      <time className="font-mono text-xs text-brand-600 font-bold">{step.duration}</time>
                    </div>
                    <div className="text-slate-500 text-sm mb-3">{step.description}</div>
                    <div className="flex flex-wrap gap-1">
                      {step.skills.map(skill => (
                        <span key={skill} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t">
              <h4 className="text-lg font-display mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-brand-600" />
                Recommended Resources
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRoadmap.roadmap_json.resources.map((resource, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700">
                    <ExternalLink size={16} className="text-slate-400" />
                    {resource}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

const AnalyticsView = ({ user }: { user: User }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [user.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" /></div>;

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Learning Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-600" />
            Task Completion Trend
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={data.taskTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="due_date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-80">
          <h3 className="text-lg mb-6 flex items-center gap-2">
            <Target size={20} className="text-brand-600" />
            Subject Distribution
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data.subjectDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="subject"
              >
                {data.subjectDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {data.subjectDistribution.map((entry: any, index: number) => (
              <div key={entry.subject} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] text-slate-500">{entry.subject}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Points</p>
          <p className="text-3xl font-display text-brand-600">{user.progress?.points || 0}</p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Tasks Done</p>
          <p className="text-3xl font-display text-emerald-600">{user.progress?.tasks_completed || 0}</p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Current Streak</p>
          <p className="text-3xl font-display text-orange-500">{user.progress?.streak || 0} 🔥</p>
        </Card>
      </div>
    </div>
  );
};

const HelpView = () => {
  const faqs = [
    { q: "How do I generate a study plan?", a: "Go to the Study Plan section, enter your subject and difficulty, and click Generate. Our AI will create a personalized roadmap for you." },
    { q: "Can I use StudyMate in my local language?", a: "Yes! Go to your Profile and change the language preference. The AI will then respond in your chosen language." },
    { q: "How do I earn points?", a: "You earn 10 points for every daily task you complete. Maintain a streak to boost your motivation!" },
    { q: "Is my data safe?", a: "We only store your email and academic preferences to personalize your experience. Your data is never shared." }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl">Help & Support</h1>
      
      <div className="space-y-4">
        <h3 className="text-lg font-display">Frequently Asked Questions</h3>
        {faqs.map((faq, i) => (
          <Card key={i}>
            <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
            <p className="text-sm text-slate-600">{faq.a}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-brand-600 text-white">
        <h3 className="text-lg font-display mb-2">Need more help?</h3>
        <p className="text-brand-100 text-sm mb-4">Our team is here to support first-generation students like you.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white text-brand-600 border-none">Contact Support</Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">Give Feedback</Button>
        </div>
      </Card>
    </div>
  );
};

const ProfileView = ({ user, onUpdate }: { user: User; onUpdate: (u: User) => void }) => {
  const [prefs, setPrefs] = useState(JSON.parse(user.preferences || '{"language": "English", "theme": "light", "learningStyle": "Visual"}'));
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    classYear: user.class_year,
    stream: user.stream,
    profilePic: user.profile_pic || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await fetch(`/api/user/${user.id}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs })
      });
      onUpdate({ ...user, preferences: JSON.stringify(prefs) });
      alert('Preferences saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/user/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      onUpdate({ ...user, ...updatedUser });
      setIsEditing(false);
      alert('Profile updated!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar'
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">My Profile</h1>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="text-sm">
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-100 bg-slate-100">
                <img 
                  src={editData.profilePic || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {avatars.map(avatar => (
                <button 
                  key={avatar}
                  onClick={() => setEditData({ ...editData, profilePic: avatar })}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all overflow-hidden",
                    editData.profilePic === avatar ? "border-brand-600 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={avatar} alt="Avatar" className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  value={editData.classYear}
                  onChange={e => setEditData({ ...editData, classYear: e.target.value })}
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Stream</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  value={editData.stream}
                  onChange={e => setEditData({ ...editData, stream: e.target.value })}
                >
                  <option>Engineering</option>
                  <option>Science</option>
                  <option>Commerce</option>
                  <option>Arts</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={handleUpdateProfile} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 shrink-0 overflow-hidden border-2 border-brand-200">
            {user.profile_pic ? (
              <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={48} />
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-display">{user.name}</h2>
            <p className="text-slate-500">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-600">{user.stream}</span>
              <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-600">{user.class_year}</span>
              {user.is_first_gen === 1 && <span className="text-xs bg-brand-100 text-brand-600 px-3 py-1 rounded-full font-extrabold">First-Gen Student</span>}
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-6">
        <h3 className="text-lg font-display flex items-center gap-2">
          <Settings size={20} className="text-brand-600" />
          App Preferences
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Learning Style</label>
            <div className="grid grid-cols-3 gap-2">
              {['Visual', 'Audio', 'Text'].map(style => (
                <button 
                  key={style}
                  onClick={() => setPrefs({ ...prefs, learningStyle: style })}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 transition-all font-black text-sm uppercase tracking-tight",
                    prefs.learningStyle === style 
                      ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200 scale-105" 
                      : "bg-white text-slate-500 border-slate-100 hover:border-brand-300 hover:bg-slate-50"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Language</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 font-bold"
              value={prefs.language}
              onChange={e => setPrefs({ ...prefs, language: e.target.value })}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Telugu</option>
              <option>Bengali</option>
            </select>
          </div>

          <Button onClick={handleSavePreferences} className="w-full py-4 text-lg font-bold" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : 'Save Preferences'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// --- Main App ---

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-brand-600 flex flex-col items-center justify-center z-[100]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6"
      >
        <GraduationCap className="text-brand-600 w-14 h-14" />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white text-4xl font-display font-bold"
      >
        StudyMate
      </motion.h1>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Loader2 className="text-white/50 animate-spin" size={24} />
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('studymate_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('studymate_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('studymate_user');
  };

  const handleUpdateUser = (u: User) => {
    setUser(u);
    localStorage.setItem('studymate_user', JSON.stringify(u));
  };

  if (!isSplashComplete) return <SplashScreen onComplete={() => setIsSplashComplete(true)} />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'study-plan', label: 'Plan', icon: BookOpen },
    { id: 'doubts', label: 'Ask AI', icon: MessageSquare },
    { id: 'career-roadmap', label: 'Career', icon: Map },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 hidden lg:block",
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-100">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-display font-bold">StudyMate</span>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  view === item.id 
                    ? "bg-brand-50 text-brand-600 font-bold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {item.id === 'profile' && user.profile_pic ? (
                  <img src={user.profile_pic} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <item.icon size={20} />
                )}
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setView('analytics')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                view === 'analytics' ? "bg-brand-50 text-brand-600 font-bold" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <BarChart3 size={20} />
              Analytics
            </button>
          </nav>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors mt-auto"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 lg:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {view !== 'dashboard' && (
              <button 
                onClick={() => setView('dashboard')}
                className="mr-2 p-1 text-slate-500 hover:text-brand-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white" size={18} />
            </div>
            <span className="font-display font-bold text-lg">StudyMate</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('profile')} 
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border-2 border-brand-100"
            >
              {user.profile_pic ? (
                <img src={user.profile_pic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} />
              )}
            </button>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-10 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && <Dashboard user={user} setView={setView} />}
              {view === 'study-plan' && <StudyPlanView user={user} />}
              {view === 'doubts' && <DoubtsView user={user} />}
              {view === 'career-roadmap' && <CareerRoadmapView user={user} />}
              {view === 'analytics' && <AnalyticsView user={user} />}
              {view === 'help' && <HelpView />}
              {view === 'profile' && <ProfileView user={user} onUpdate={handleUpdateUser} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Task Modal (Mobile only) */}
        <AnimatePresence>
          {showTaskModal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTaskModal(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 lg:hidden shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-display mb-4">Quick Add Task</h3>
                <TaskSection userId={user.id} />
                <Button className="w-full mt-4" variant="secondary" onClick={() => setShowTaskModal(false)}>Close</Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 lg:hidden z-40">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn("mobile-nav-item", view === item.id && "active")}
            >
              {item.id === 'profile' && user.profile_pic ? (
                <img src={user.profile_pic} className={cn("w-6 h-6 rounded-full object-cover", view === item.id && "ring-2 ring-brand-600")} />
              ) : (
                <item.icon size={22} strokeWidth={view === item.id ? 2.5 : 2} />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="fixed bottom-20 right-6 lg:bottom-4 lg:right-6 text-slate-400 text-[15px] font-normal z-30 pointer-events-none">
          Developed by Future Founders
        </div>
      </main>
    </div>
  );
}
