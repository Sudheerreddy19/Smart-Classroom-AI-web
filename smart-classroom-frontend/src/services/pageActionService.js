/**
 * pageActionService.js
 * Inspects and drives DOM actions on the current page:
 * - Clicking buttons/links by label or intent (e.g. "Add Student", "Refresh", "Export")
 * - Switching tabs (e.g. "Active", "Inactive", "All Students")
 * - Filling search inputs with React event dispatch
 * - Modal operations (Close, Cancel, Submit, Save)
 * - Cross-page action orchestration (e.g. navigating to /students then clicking "Add Student")
 */

/**
 * Dispatches proper synthetic events so React's useState / onChange handlers pick up value updates.
 */
export const setReactInputValue = (inputElement, value) => {
  if (!inputElement) return false;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(inputElement, value);
  } else {
    inputElement.value = value;
  }

  inputElement.dispatchEvent(new Event("input", { bubbles: true }));
  inputElement.dispatchEvent(new Event("change", { bubbles: true }));
  inputElement.focus();
  return true;
};

/**
 * Searches for a clickable element on the page matching target text and clicks it.
 * @param {string} targetPhrase - What the user asked to click (e.g. "Add Student", "Active", "Refresh")
 * @returns {Object} { success: boolean, label?: string, target?: string }
 */
export const clickButtonByText = (targetPhrase = "") => {
  if (!targetPhrase) return { success: false };

  // Normalize: remove noise words ("select the", "click the", "open the", "choose the")
  const cleanTarget = targetPhrase
    .toLowerCase()
    .replace(/^(please\s+)?(select\s+(the\s+)?|click\s+(the\s+)?|press\s+(the\s+)?|choose\s+(the\s+)?|open\s+(the\s+)?|hit\s+(the\s+)?|tap\s+(the\s+)?)/i, "")
    .trim();

  const candidates = Array.from(
    document.querySelectorAll(
      "button, a, [role='button'], [role='tab'], input[type='button'], input[type='submit']"
    )
  ).filter((el) => {
    // Only visible and enabled elements
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      !el.disabled
    );
  });

  const getLabel = (el) => {
    return (
      el.innerText ||
      el.textContent ||
      el.getAttribute("aria-label") ||
      el.title ||
      el.value ||
      ""
    ).toLowerCase().trim();
  };

  // 1. Exact match
  let matched = candidates.find((el) => getLabel(el) === cleanTarget);

  // 2. Starts-with or ends-with match
  if (!matched) {
    matched = candidates.find((el) => {
      const l = getLabel(el);
      return l.startsWith(cleanTarget) || l.endsWith(cleanTarget);
    });
  }

  // 3. Substring match
  if (!matched) {
    matched = candidates.find((el) => getLabel(el).includes(cleanTarget));
  }

  // 4. Token match (all words in cleanTarget are inside label)
  if (!matched) {
    const words = cleanTarget.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      matched = candidates.find((el) => {
        const l = getLabel(el);
        return words.every((w) => l.includes(w));
      });
    }
  }

  if (matched) {
    matched.scrollIntoView({ behavior: "smooth", block: "center" });
    matched.click();
    const displayName = (matched.innerText || matched.textContent || cleanTarget)
      .replace(/\s+/g, " ")
      .trim();
    return { success: true, label: displayName };
  }

  return { success: false, target: cleanTarget };
};

/**
 * Searches for a search input and fills it with query string.
 */
export const searchOnPage = (query = "") => {
  if (!query) return { success: false };

  const inputs = Array.from(
    document.querySelectorAll('input[type="search"], input[placeholder*="search" i], input[type="text"]')
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  });

  if (inputs.length > 0) {
    const searchBox = inputs[0];
    setReactInputValue(searchBox, query);
    return { success: true, query };
  }

  return { success: false };
};

/**
 * Closes currently open modals or dialogs.
 * Supports Lucide X icon buttons, Cancel buttons, and modal backdrop click.
 * @param {string} specificTarget - Optional name of the dialog to close
 * @returns {Object} { success: boolean, title?: string }
 */
export const closeModalOnPage = (specificTarget = "") => {
  // 1. Find all active modal containers on the page
  const modalContainers = Array.from(
    document.querySelectorAll(".fixed.inset-0, [role='dialog'], .backdrop-blur-sm")
  ).map((el) => el.closest(".fixed.inset-0") || el).filter(Boolean);

  // Remove duplicate elements
  const uniqueModals = Array.from(new Set(modalContainers)).filter((m) => {
    const style = window.getComputedStyle(m);
    return style.display !== "none" && style.visibility !== "hidden";
  });

  if (uniqueModals.length === 0) {
    return { success: false, reason: "NO_MODAL" };
  }

  // Target the topmost modal
  const targetModal = uniqueModals[uniqueModals.length - 1];
  const modalTitle =
    targetModal.querySelector("h2, h3, h1, [class*='title']")?.innerText?.trim() || "dialog";

  // Check 1: Lucide X icon inside a button
  const xButton = targetModal.querySelector(
    "button svg.lucide-x, button svg[class*='lucide-x'], button [class*='lucide-x']"
  )?.closest("button");

  if (xButton) {
    xButton.click();
    return { success: true, title: modalTitle };
  }

  // Check 2: Button with Cancel or Close text
  const textButton = Array.from(targetModal.querySelectorAll("button")).find((btn) => {
    const txt = (btn.innerText || btn.textContent || btn.title || btn.getAttribute("aria-label") || "")
      .toLowerCase()
      .trim();
    return txt === "cancel" || txt === "close" || txt === "dismiss" || txt === "✕" || txt === "x";
  });

  if (textButton) {
    textButton.click();
    return { success: true, title: modalTitle };
  }

  // Check 3: Backdrop element with onClick handler
  const backdrop = targetModal.querySelector(".backdrop-blur-sm, .bg-black\\/40");
  if (backdrop) {
    backdrop.click();
    return { success: true, title: modalTitle };
  }

  return { success: false, reason: "NO_CLOSE_BUTTON" };
};


/**
 * Submits or saves currently open modal form.
 */
export const submitModalOnPage = () => {
  const submitButtons = Array.from(
    document.querySelectorAll("button[type='submit'], form button, button")
  ).filter((btn) => {
    const text = (btn.innerText || btn.textContent || btn.value || "").toLowerCase();
    return (
      text.includes("save") ||
      text.includes("submit") ||
      text.includes("create") ||
      text.includes("confirm")
    );
  });

  if (submitButtons.length > 0) {
    submitButtons[0].click();
    return true;
  }
  return false;
};

/**
 * Maps common action phrases to target pages if user is not currently on that page.
 */
export const CROSS_PAGE_ACTIONS = [
  {
    pattern: /(add student|create student|register student|new student)/i,
    route: "/students",
    buttonLabel: "add student",
    actionName: "Add Student",
  },
  {
    pattern: /(add teacher|create teacher|new teacher|register teacher)/i,
    route: "/teachers",
    buttonLabel: "add teacher",
    actionName: "Add Teacher",
  },
  {
    pattern: /(add classroom|create classroom|new classroom)/i,
    route: "/classrooms",
    buttonLabel: "add classroom",
    actionName: "Add Classroom",
  },
  {
    pattern: /(add department|create department|new department)/i,
    route: "/departments",
    buttonLabel: "add department",
    actionName: "Add Department",
  },
  {
    pattern: /(add subject|create subject|new subject)/i,
    route: "/subjects",
    buttonLabel: "add subject",
    actionName: "Add Subject",
  },
  {
    pattern: /(add semester|create semester|new semester)/i,
    route: "/semesters",
    buttonLabel: "add semester",
    actionName: "Add Semester",
  },
  {
    pattern: /(add user|create user|new user|add admin)/i,
    route: "/admin-management",
    buttonLabel: "add user",
    actionName: "Add User",
  },
];
