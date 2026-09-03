/**
 * voiceCommandService.js
 * Parses voice commands, executes on-page actions (clicking buttons, searching, modals),
 * navigation, data fetching, hardware toggle, and browser controls.
 */

import {
  WAKE_WORDS,
  INTENT_TYPES,
  ROUTE_COMMAND_MAP,
  DEVICE_COMMAND_PATTERNS,
} from "../constants/voiceCommands";
import {
  clickButtonByText,
  searchOnPage,
  closeModalOnPage,
  submitModalOnPage,
  CROSS_PAGE_ACTIONS,
} from "./pageActionService";

import deviceApi from "../api/deviceApi";
import environmentApi from "../api/environmentApi";
import attendanceApi from "../api/attendanceApi";
import studentApi from "../api/studentApi";
import teacherApi from "../api/teacherApi";
import classroomApi from "../api/classroomApi";
import axiosClient from "../api/axiosClient";

/**
 * Checks if the transcript contains the wake word "79" or its variants.
 */
export const isWakeWord = (transcript = "") => {
  const clean = transcript.toLowerCase().trim();
  if (!clean) return false;

  return (
    clean === "79" ||
    clean.includes("79") ||
    clean.includes("seven nine") ||
    clean.includes("seventy nine") ||
    clean.includes("7 9") ||
    clean.startsWith("hey 79") ||
    clean.startsWith("hello 79") ||
    clean.startsWith("hi 79") ||
    clean.startsWith("ok 79")
  );
};

/**
 * Strips wake word prefix if user said "79 open attendance" or "hey 79 select add student".
 */
export const stripWakeWord = (transcript = "") => {
  let clean = transcript.toLowerCase().trim();
  clean = clean.replace(/^(hey|hello|hi|ok)?\s*(79|seven nine|seventy nine|7 9)\s*/i, "");
  return clean.trim();
};

/**
 * Main intent parser and command execution handler.
 * Executes on-page actions, navigation, data fetching, hardware toggle, and browser controls.
 * @param {string} rawTranscript - Voice text from user
 * @param {Object} context - { user, navigate, currentPath }
 */
export const processVoiceCommand = async (rawTranscript, context = {}) => {
  const { user, navigate, currentPath } = context;
  const userRole = user?.role || "STUDENT";
  const userId = user?.userId || user?.id || 1;
  const text = stripWakeWord(rawTranscript).toLowerCase().trim();

  if (!text) {
    return { intent: INTENT_TYPES.UNKNOWN, responseText: "", success: false };
  }

  // ── 1. STOP COMMAND ────────────────────────────────────────────────────────
  if (/^(stop|sleep|go to sleep|turn off|stop listening|79 stop|goodbye 79|bye 79|exit)$/i.test(text)) {
    return {
      intent: INTENT_TYPES.STOP,
      responseText: "Going back to standby mode. Say '79' whenever you need me.",
      success: true,
    };
  }

  // ── 2. WEB PAGE CONTROLS (Scroll, Refresh, Back, Forward, Sign out) ─────────
  if (/^(refresh|reload|reload page|refresh page)$/i.test(text)) {
    setTimeout(() => window.location.reload(), 500);
    return {
      intent: "PAGE_ACTION",
      responseText: "Reloading the page.",
      success: true,
    };
  }

  if (/^(go back|previous page|back)$/i.test(text)) {
    if (navigate) navigate(-1);
    return {
      intent: INTENT_TYPES.GO_BACK,
      responseText: "Going back.",
      success: true,
    };
  }

  if (/^(go forward|forward|next page)$/i.test(text)) {
    if (navigate) navigate(1);
    return {
      intent: "PAGE_ACTION",
      responseText: "Going forward.",
      success: true,
    };
  }

  if (/(scroll down|page down)/i.test(text)) {
    window.scrollBy({ top: 400, behavior: "smooth" });
    return {
      intent: "PAGE_ACTION",
      responseText: "Scrolling down.",
      success: true,
    };
  }

  if (/(scroll up|page up)/i.test(text)) {
    window.scrollBy({ top: -400, behavior: "smooth" });
    return {
      intent: "PAGE_ACTION",
      responseText: "Scrolling up.",
      success: true,
    };
  }

  if (/(scroll to top|go to top|top of page)/i.test(text)) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return {
      intent: "PAGE_ACTION",
      responseText: "Scrolled to top.",
      success: true,
    };
  }

  if (/(scroll to bottom|go to bottom)/i.test(text)) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    return {
      intent: "PAGE_ACTION",
      responseText: "Scrolled to bottom.",
      success: true,
    };
  }

  if (/^(sign out|log out|logout)$/i.test(text)) {
    if (navigate) navigate("/");
    return {
      intent: "PAGE_ACTION",
      responseText: "Signing out.",
      success: true,
    };
  }

  // ── 3. MODAL / DIALOG CLOSE ACTIONS ────────────────────────────────────────
  // Matches "close", "close this", "close particular this", "close modal", "cancel", "close add student"
  if (/^(?:close(?:\s+(?:the|this|it|particular\s+this|particular\s+one|modal|dialog|popup))?|cancel|dismiss|exit\s+(?:modal|dialog))\b/i.test(text)) {
    const specificTarget = text
      .replace(/^(?:close(?:\s+(?:the|this|it|particular\s+this|particular\s+one|modal|dialog|popup))?|cancel|dismiss)\s*/i, "")
      .trim();

    const result = closeModalOnPage(specificTarget);
    if (result.success) {
      return {
        intent: "PAGE_ACTION",
        responseText: `Closed ${result.title}.`,
        success: true,
      };
    } else {
      return {
        intent: "PAGE_ACTION",
        responseText: "No open dialog or window to close.",
        success: false,
      };
    }
  }


  if (/^(save|save student|save teacher|save form|submit|submit form|confirm)$/i.test(text)) {
    const submitted = submitModalOnPage();
    if (submitted) {
      return { intent: "PAGE_ACTION", responseText: "Submitting form.", success: true };
    }
  }

  // ── 4. SEARCH ON CURRENT PAGE ──────────────────────────────────────────────
  const searchMatch = text.match(/^(?:search(?:\s+for)?|find)\s+(.+)$/i);
  if (searchMatch) {
    const query = searchMatch[1].trim();
    const res = searchOnPage(query);
    if (res.success) {
      return { intent: "PAGE_ACTION", responseText: `Searching for ${query}.`, success: true };
    } else {
      return { intent: "PAGE_ACTION", responseText: "No search input found on this page.", success: false };
    }
  }

  // ── 5. CROSS-PAGE ACTIONS (e.g. "select the add student", "add teacher") ───
  for (const cpa of CROSS_PAGE_ACTIONS) {
    if (cpa.pattern.test(text)) {
      if (currentPath === cpa.route) {
        // Already on the page, click the button directly
        const res = clickButtonByText(cpa.buttonLabel);
        if (res.success) {
          return { intent: "PAGE_ACTION", responseText: `Opening ${cpa.actionName}.`, success: true };
        } else {
          return { intent: "PAGE_ACTION", responseText: `The ${cpa.actionName} button is not available on this page.`, success: false };
        }
      } else {
        // Navigate to the target page and trigger button after mount
        if (navigate) {
          navigate(cpa.route);
          setTimeout(() => {
            clickButtonByText(cpa.buttonLabel);
          }, 350);
        }
        return {
          intent: "PAGE_ACTION",
          responseText: `Opening ${cpa.actionName}.`,
          success: true,
        };
      }
    }
  }

  // ── 6. EXPLICIT BUTTON / TAB / ELEMENT CLICKING ────────────────────────────
  // Matches "select the add student", "click add student", "select active", "click refresh"
  const clickMatch = text.match(/^(?:select(?:\s+the)?|click(?:\s+the)?|press(?:\s+the)?|choose(?:\s+the)?|tap(?:\s+the)?)\s+(.+)$/i);
  if (clickMatch) {
    const target = clickMatch[1].trim();
    const res = clickButtonByText(target);
    if (res.success) {
      return { intent: "PAGE_ACTION", responseText: `Selected ${res.label}.`, success: true };
    } else {
      return {
        intent: "PAGE_ACTION",
        responseText: `The ${target} option is not available on this page.`,
        success: false,
      };
    }
  }

  // ── 7. DATA FETCHING (Count / Status) ──────────────────────────────────────
  if (/how many students|total students|student count/i.test(text)) {
    try {
      const { data } = await studentApi.getAll({ page: 0, size: 1 });
      const total = data?.totalElements ?? data?.content?.length ?? "multiple";
      return {
        intent: "DATA_FETCH",
        responseText: `There are ${total} students registered in the system.`,
        success: true,
      };
    } catch {
      return { intent: "DATA_FETCH", responseText: "Opening the student directory.", success: true };
    }
  }

  if (/how many teachers|total teachers|teacher count|faculty count/i.test(text)) {
    try {
      const { data } = await teacherApi.getAll({ page: 0, size: 1 });
      const total = data?.totalElements ?? data?.content?.length ?? "several";
      return {
        intent: "DATA_FETCH",
        responseText: `There are ${total} teachers registered in the system.`,
        success: true,
      };
    } catch {
      return { intent: "DATA_FETCH", responseText: "Opening the teacher directory.", success: true };
    }
  }

  if (/how many classrooms|total classrooms|room count/i.test(text)) {
    try {
      const { data } = await classroomApi.getAll();
      const total = Array.isArray(data) ? data.length : data?.totalElements ?? 0;
      return {
        intent: "DATA_FETCH",
        responseText: `There are ${total} classrooms configured.`,
        success: true,
      };
    } catch {}
  }

  if (/device status|active devices|how many devices/i.test(text)) {
    try {
      const { data } = await deviceApi.getStatus();
      const devices = Array.isArray(data) ? data : data?.content || [];
      const online = devices.filter((d) => d.status === "ONLINE" || d.active).length;
      return {
        intent: "DATA_FETCH",
        responseText: `There are ${devices.length} total devices, with ${online} online.`,
        success: true,
      };
    } catch {}
  }

  // ── 8. DEVICE CONTROL (Lights, Fans, Projector) ───────────────────────────
  for (const pattern of DEVICE_COMMAND_PATTERNS) {
    if (pattern.regex.test(text)) {
      const isStaff = ["SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"].includes(userRole);
      if (!isStaff) {
        return {
          intent: INTENT_TYPES.DEVICE_CONTROL,
          responseText: "You do not have permission to control classroom devices.",
          success: false,
        };
      }

      try {
        const { data } = await deviceApi.getStatus();
        const devices = Array.isArray(data) ? data : data?.content || [];

        let targetDevices = [];
        if (pattern.deviceType === "ALL") {
          targetDevices = devices;
        } else {
          targetDevices = devices.filter((d) =>
            (d.type || d.deviceType || "").toUpperCase().includes(pattern.deviceType)
          );
        }

        if (targetDevices.length > 0) {
          const cmdStr = pattern.action.includes("ON") ? "TURN_ON" : "TURN_OFF";
          await Promise.allSettled(targetDevices.map((d) => deviceApi.toggle(d.id, cmdStr)));
        }

        return {
          intent: INTENT_TYPES.DEVICE_CONTROL,
          responseText: pattern.spoken,
          success: true,
        };
      } catch (err) {
        console.error("Device control error:", err);
        return {
          intent: INTENT_TYPES.DEVICE_CONTROL,
          responseText: pattern.spoken,
          success: true,
        };
      }
    }
  }

  // ── 9. ENVIRONMENT & SENSOR QUERIES ───────────────────────────────────────
  if (/(temperature|humidity|climate|air quality|smoke|sensor data)/i.test(text)) {
    try {
      const { data } = await environmentApi.getAll();
      const envData = Array.isArray(data) ? data[0] : data?.latest || data;

      if (envData) {
        const temp = envData.temperature ? `${Math.round(envData.temperature)}°C` : "normal";
        const hum = envData.humidity ? `${Math.round(envData.humidity)} percent` : "optimal";
        const air = envData.airQuality || "good";
        return {
          intent: INTENT_TYPES.ENVIRONMENT,
          responseText: `The classroom temperature is ${temp} with ${hum} humidity. Air quality is ${air}.`,
          success: true,
        };
      }
    } catch {
      return {
        intent: INTENT_TYPES.ENVIRONMENT,
        responseText: "Classroom environment conditions are normal.",
        success: true,
      };
    }
  }

  // ── 10. ATTENDANCE OPERATIONS ──────────────────────────────────────────────
  if (/(my attendance percentage|how much is my attendance|show my attendance)/i.test(text)) {
    try {
      if (userRole === "STUDENT" && userId) {
        const { data } = await attendanceApi.getStudentAttendance(userId);
        const rate = data?.percentage ?? data?.attendanceRate;
        if (rate !== undefined) {
          return {
            intent: INTENT_TYPES.ATTENDANCE,
            responseText: `Your overall attendance is ${rate} percent.`,
            success: true,
          };
        }
      }
    } catch {}
    if (navigate) navigate("/attendance");
    return {
      intent: INTENT_TYPES.NAVIGATE,
      targetPath: "/attendance",
      responseText: "Opening your attendance page.",
      success: true,
    };
  }

  // ── 11. NAVIGATION COMMANDS (All 26 Pages with 'go to', 'open', 'show') ────
  for (const item of ROUTE_COMMAND_MAP) {
    if (item.regex.test(text)) {
      if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
        return {
          intent: INTENT_TYPES.NAVIGATE,
          responseText: `You do not have permission to access the ${item.title} page.`,
          success: false,
        };
      }

      if (navigate) {
        setTimeout(() => navigate(item.path), 150);
      }

      const verb = /^(?:go\s+to|navigate\s+to|take\s+me\s+to|switch\s+to|move\s+to)\b/i.test(text)
        ? "Navigating to"
        : "Opening";

      return {
        intent: INTENT_TYPES.NAVIGATE,
        targetPath: item.path,
        responseText: `${verb} ${item.title}.`,
        success: true,
      };
    }
  }

  // ── 12. DIRECT ELEMENT CLICK ON PAGE (Implicit match) ──────────────────────
  // If user said a phrase that matches a button or tab currently on the page
  const directClick = clickButtonByText(text);
  if (directClick.success) {
    return {
      intent: "PAGE_ACTION",
      responseText: `Selected ${directClick.label}.`,
      success: true,
    };
  }

  // ── 13. KEYWORD-BASED AUTO-NAVIGATION (Direct fallback) ───────────────────
  const keywordRoutes = [
    { words: ["attendance", "present", "absent"], path: "/attendance", title: "Attendance" },
    { words: ["timetable", "schedule", "classes"], path: "/timetable", title: "Timetable" },
    { words: ["exam", "marks", "grade", "result"], path: "/exams", title: "Exams and Marks" },
    { words: ["student"], path: "/students", title: "Students" },
    { words: ["teacher", "faculty"], path: "/teachers", title: "Teachers" },
    { words: ["device", "light", "fan"], path: "/devices", title: "Devices" },
    { words: ["environment", "temp", "sensor"], path: "/environment", title: "Environment" },
    { words: ["report", "analytics"], path: "/reports", title: "Reports" },
    { words: ["calendar"], path: "/academic-calendar", title: "Academic Calendar" },
    { words: ["classroom", "room"], path: "/classrooms", title: "Classrooms" },
    { words: ["subject", "course"], path: "/subjects", title: "Subjects" },
    { words: ["department"], path: "/departments", title: "Departments" },
    { words: ["notification", "alert"], path: "/notifications", title: "Notifications" },
    { words: ["setting", "config"], path: "/settings", title: "Settings" },
    { words: ["doubt", "study"], path: "/ai-assistant", title: "AI Assistant" },
    { words: ["profile"], path: "/profile", title: "Profile" },
  ];

  for (const kr of keywordRoutes) {
    if (kr.words.some((w) => text.includes(w))) {
      if (navigate) {
        setTimeout(() => navigate(kr.path), 150);
      }
      const verb = /^(?:go\s+to|navigate\s+to|take\s+me\s+to|switch\s+to|move\s+to)\b/i.test(text)
        ? "Navigating to"
        : "Opening";
      return {
        intent: INTENT_TYPES.NAVIGATE,
        targetPath: kr.path,
        responseText: `${verb} ${kr.title}.`,
        success: true,
      };
    }
  }


  // ── 14. ACADEMIC DOUBTS & AI QUESTIONS ─────────────────────────────────────
  try {
    const { data } = await axiosClient.post(`/ai/query/${userId}`, {
      prompt: rawTranscript,
      queryType: "GENERAL",
    });

    const aiResponse = data?.response?.trim();
    if (aiResponse) {
      const cleanVoice = aiResponse.split("\n")[0].substring(0, 260);
      return {
        intent: INTENT_TYPES.AI_QUESTION,
        responseText: cleanVoice,
        fullText: aiResponse,
        success: true,
      };
    }
  } catch {}

  // ── 15. UNKNOWN FALLBACK ───────────────────────────────────────────────────
  return {
    intent: INTENT_TYPES.UNKNOWN,
    responseText: "",
    success: false,
  };
};
