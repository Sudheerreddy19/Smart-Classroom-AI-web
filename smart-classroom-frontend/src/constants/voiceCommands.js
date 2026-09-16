/**
 * voiceCommands.js
 * Central dictionary for wake words, intent types, navigation mapping for ALL pages,
 * device commands, and conversational response templates.
 */

export const ASSISTANT_NAME = "79";

export const WAKE_WORDS = [
  "79",
  "hey 79",
  "hello 79",
  "hi 79",
  "ok 79",
  "seven nine",
  "hey seven nine",
  "hello seven nine",
  "hi seven nine",
];

export const INTENT_TYPES = {
  WAKE: "WAKE",
  NAVIGATE: "NAVIGATE",
  DEVICE_CONTROL: "DEVICE_CONTROL",
  ENVIRONMENT: "ENVIRONMENT",
  ATTENDANCE: "ATTENDANCE",
  AI_QUESTION: "AI_QUESTION",
  HELP: "HELP",
  STOP: "STOP",
  GO_BACK: "GO_BACK",
  UNKNOWN: "UNKNOWN",
};

// Common navigation prefix regex: "go to", "navigate to", "open", "show", "take me to", "switch to"
const NAV_PREFIX = "(?:go\\s+to|navigate\\s+to|take\\s+me\\s+to|switch\\s+to|move\\s+to|open|show)?\\s*";

/**
 * Route mapping covering ALL existing project pages in AppRoutes.jsx
 */
export const ROUTE_COMMAND_MAP = [
  // Dashboard & Home
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:dashboard|home)$`, "i"),
    path: "/dashboard",
    title: "Dashboard",
  },
  // Attendance Pages
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:take|mark|start)?\\s*(?:face\\s+attendance|take\\s+attendance)$`, "i"),
    path: "/attendance/take",
    title: "Take Attendance",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:attendance\\s+report|attendance\\s+analytics|summary\\s+of\\s+attendance)$`, "i"),
    path: "/attendance/report",
    title: "Attendance Report",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:my\\s+attendance|attendance)$`, "i"),
    path: "/attendance",
    title: "Attendance",
  },
  // Timetable
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:timetable\\s+builder|build\\s+timetable|create\\s+timetable)$`, "i"),
    path: "/timetable/builder",
    title: "Timetable Builder",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:timetable|schedule|routine|class\\s+schedule|my\\s+schedule)$`, "i"),
    path: "/timetable",
    title: "Timetable",
  },
  // Profile
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:my\\s+profile|student\\s+profile|user\\s+profile|profile)$`, "i"),
    path: "/profile",
    title: "Profile",
  },
  // Live Bus Tracking (STUDENT only)
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:live\\s+bus\\s+tracking|bus\\s+tracking|my\\s+bus|track\\s+bus|live\\s+bus|bus)$`, "i"),
    path: "/bus-tracking",
    title: "Live Bus Tracking",
    requiredRoles: ["STUDENT"],
  },
  // Student Doubts (AI Assistant chat page)
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:doubts|academic\\s+doubts|ai\\s+assistant\\s+page|ai\\s+assistant|doubt\\s+solver|study\\s+assistant|chat\\s+assistant)$`, "i"),
    path: "/ai-assistant",
    title: "AI Assistant",
  },
  // Exams & Marks
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:exams|marks|my\\s+marks|results|grades|test\\s+marks|my\\s+exams)$`, "i"),
    path: "/exams",
    title: "Exams and Marks",
  },
  // Notifications & Settings
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:notifications|alerts|announcements|my\\s+notifications)$`, "i"),
    path: "/notifications",
    title: "Notifications",
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:settings|configuration|preferences|system\\s+settings)$`, "i"),
    path: "/settings",
    title: "Settings",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  // Student Management
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:import\\s+students|student\\s+import|upload\\s+students)$`, "i"),
    path: "/student-import",
    title: "Student Import",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:face\\s+registration|face\\s+capture|register\\s+face)$`, "i"),
    path: "/face-registration",
    title: "Face Registration",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:students|student\\s+list|all\\s+students)$`, "i"),
    path: "/students",
    title: "Students",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  // Teachers Management
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:teachers|teacher\\s+list|faculty)$`, "i"),
    path: "/teachers",
    title: "Teachers",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  // Academic Structure
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:departments|department\\s+list)$`, "i"),
    path: "/departments",
    title: "Departments",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:subjects|courses|subject\\s+list)$`, "i"),
    path: "/subjects",
    title: "Subjects",
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:semester\\s+promotion|promote\\s+students|promote\\s+semester)$`, "i"),
    path: "/semester-promotion",
    title: "Semester Promotion",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:semesters|semester\\s+list)$`, "i"),
    path: "/semesters",
    title: "Semesters",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:academic\\s+calendar|calendar|school\\s+calendar)$`, "i"),
    path: "/academic-calendar",
    title: "Academic Calendar",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:classroom\\s+capacity|room\\s+capacity)$`, "i"),
    path: "/classrooms/capacity",
    title: "Classroom Capacity",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:classrooms|rooms|classroom\\s+list)$`, "i"),
    path: "/classrooms",
    title: "Classrooms",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:sections|section\\s+manager)$`, "i"),
    path: "/sections",
    title: "Section Manager",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  // Devices & Environment
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:devices|smart\\s+devices|device\\s+control|device\\s+management)$`, "i"),
    path: "/devices",
    title: "Devices",
    requiredRoles: ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"],
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:environment|climate\\s+monitoring|sensors|air\\s+quality)$`, "i"),
    path: "/environment",
    title: "Environment",
  },
  // Reports & Administration
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:reports|system\\s+reports|institution\\s+analytics)$`, "i"),
    path: "/reports",
    title: "Reports",
  },
  {
    regex: new RegExp(`^${NAV_PREFIX}(?:admin\\s+management|user\\s+management|manage\\s+admins)$`, "i"),
    path: "/admin-management",
    title: "User Management",
    requiredRoles: ["SUPER_ADMIN", "ADMIN"],
  },
];

export const DEVICE_COMMAND_PATTERNS = [
  {
    regex: /(turn on|switch on|enable|start)\s*(the)?\s*(light|lights)/i,
    action: "ON",
    deviceType: "LIGHT",
    spoken: "Turning on the classroom lights.",
  },
  {
    regex: /(turn off|switch off|disable|stop)\s*(the)?\s*(light|lights)/i,
    action: "OFF",
    deviceType: "LIGHT",
    spoken: "Turning off the classroom lights.",
  },
  {
    regex: /(turn on|switch on|enable|start)\s*(the)?\s*(fan|fans)/i,
    action: "ON",
    deviceType: "FAN",
    spoken: "Turning on the fan.",
  },
  {
    regex: /(turn off|switch off|disable|stop)\s*(the)?\s*(fan|fans)/i,
    action: "OFF",
    deviceType: "FAN",
    spoken: "Turning off the fan.",
  },
  {
    regex: /(turn on|start|power on)\s*(the)?\s*(projector)/i,
    action: "ON",
    deviceType: "PROJECTOR",
    spoken: "Starting the projector.",
  },
  {
    regex: /(turn off|shutdown|power off)\s*(the)?\s*(projector)/i,
    action: "OFF",
    deviceType: "PROJECTOR",
    spoken: "Turning off the projector.",
  },
  {
    regex: /(turn on|enable)\s*(all devices|all)/i,
    action: "ALL_ON",
    deviceType: "ALL",
    spoken: "Turning on all classroom devices.",
  },
  {
    regex: /(turn off|disable)\s*(all devices|all)/i,
    action: "ALL_OFF",
    deviceType: "ALL",
    spoken: "Turning off all classroom devices.",
  },
];
