import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("studymate.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    is_first_gen INTEGER,
    class_year TEXT,
    stream TEXT,
    profile_pic TEXT,
    preferences TEXT DEFAULT '{"language": "English", "theme": "light"}'
  );
`);

// Migration: Add profile_pic column if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN profile_pic TEXT").run();
} catch (e) {
  // Column already exists or other error
}

db.exec(`
  CREATE TABLE IF NOT EXISTS study_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT,
    difficulty TEXT,
    plan_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tasks_completed INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    last_active DATE,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    due_date TEXT,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS career_roadmaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    stream TEXT,
    goal TEXT,
    roadmap_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket handling
  const clients = new Map<number, Set<WebSocket>>();

  wss.on("connection", (ws, req) => {
    const userId = parseInt(new URL(req.url || "", `http://${req.headers.host}`).searchParams.get("userId") || "0");
    if (userId) {
      if (!clients.has(userId)) clients.set(userId, new Set());
      clients.get(userId)!.add(ws);
      ws.on("close", () => clients.get(userId)?.delete(ws));
    }
  });

  const broadcastToUser = (userId: number, data: any) => {
    const userClients = clients.get(userId);
    if (userClients) {
      const message = JSON.stringify(data);
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(message);
      });
    }
  };

  // API Routes
  app.post("/api/auth/signup", (req, res) => {
    const { name, email, isFirstGen, classYear, stream } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (name, email, is_first_gen, class_year, stream) VALUES (?, ?, ?, ?, ?)").run(
        name, email, isFirstGen ? 1 : 0, classYear, stream
      );
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
      
      // Initialize progress
      db.prepare("INSERT INTO progress (user_id, last_active) VALUES (?, ?)").run(info.lastInsertRowid, new Date().toISOString().split('T')[0]);
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/user/:email", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(req.params.email);
    if (user) {
      const progress = db.prepare("SELECT * FROM progress WHERE user_id = ?").get(user.id);
      res.json({ ...user, progress });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/study-plan", (req, res) => {
    const { userId, subject, difficulty, planJson } = req.body;
    const info = db.prepare("INSERT INTO study_plans (user_id, subject, difficulty, plan_json) VALUES (?, ?, ?, ?)").run(
      userId, subject, difficulty, JSON.stringify(planJson)
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/study-plans/:userId", (req, res) => {
    const plans = db.prepare("SELECT * FROM study_plans WHERE user_id = ?").all(req.params.userId);
    res.json(plans.map((p: any) => ({ ...p, plan_json: JSON.parse(p.plan_json) })));
  });

  // Career Roadmap Routes
  app.get("/api/career-roadmaps/:userId", (req, res) => {
    const roadmaps = db.prepare("SELECT * FROM career_roadmaps WHERE user_id = ?").all(req.params.userId);
    res.json(roadmaps.map((r: any) => ({ ...r, roadmap_json: JSON.parse(r.roadmap_json) })));
  });

  app.post("/api/career-roadmap", (req, res) => {
    const { userId, stream, goal, roadmapJson } = req.body;
    const info = db.prepare("INSERT INTO career_roadmaps (user_id, stream, goal, roadmap_json) VALUES (?, ?, ?, ?)").run(
      userId, stream, goal, JSON.stringify(roadmapJson)
    );
    res.json({ id: info.lastInsertRowid });
  });

  // Task Routes
  app.get("/api/tasks/:userId", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC").all(req.params.userId);
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { userId, title, dueDate } = req.body;
    const info = db.prepare("INSERT INTO tasks (user_id, title, due_date) VALUES (?, ?, ?)").run(userId, title, dueDate);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
    broadcastToUser(userId, { type: "TASK_CREATED", task });
    res.json(task);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { completed } = req.body;
    db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(completed ? 1 : 0, req.params.id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    
    // Update progress and points if completed
    if (completed) {
      db.prepare("UPDATE progress SET tasks_completed = tasks_completed + 1, points = points + 10 WHERE user_id = ?").run(task.user_id);
      // Add notification for points
      db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)").run(task.user_id, "You earned 10 points for completing a task!", "points");
    } else {
      db.prepare("UPDATE progress SET tasks_completed = MAX(0, tasks_completed - 1), points = MAX(0, points - 10) WHERE user_id = ?").run(task.user_id);
    }
    
    broadcastToUser(task.user_id, { type: "TASK_UPDATED", task });
    res.json(task);
  });

  // Notification Routes
  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(req.params.userId);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Preference Routes
  app.patch("/api/user/:userId/preferences", (req, res) => {
    const { preferences } = req.body;
    db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(JSON.stringify(preferences), req.params.userId);
    res.json({ success: true });
  });

  // Analytics Route
  app.get("/api/analytics/:userId", (req, res) => {
    const userId = req.params.userId;
    // Mocking some trend data based on tasks
    const tasks = db.prepare("SELECT due_date, COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1 GROUP BY due_date ORDER BY due_date DESC LIMIT 7").all(userId);
    const studyPlans = db.prepare("SELECT subject, COUNT(*) as count FROM study_plans WHERE user_id = ? GROUP BY subject").all(userId);
    
    res.json({
      taskTrends: tasks.reverse(),
      subjectDistribution: studyPlans
    });
  });

  // Profile Update Route
  app.patch("/api/user/:userId/profile", (req, res) => {
    const { name, classYear, stream, profilePic } = req.body;
    db.prepare("UPDATE users SET name = ?, class_year = ?, stream = ?, profile_pic = ? WHERE id = ?").run(
      name, classYear, stream, profilePic, req.params.userId
    );
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.userId);
    res.json(user);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (task) {
      db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
      broadcastToUser(task.user_id, { type: "TASK_DELETED", taskId: parseInt(req.params.id) });
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
