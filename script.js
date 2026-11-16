/**
 * ==============================================================================
 * STUDYFLOW — Student Productivity & Study-Planning Web Application (V1)
 * ==============================================================================
 * Frontend-only prototype built with pure HTML5, CSS3, and Vanilla JavaScript.
 *
 * NOTE ON PROTOTYPE AUTHENTICATION:
 * This prototype uses client-side simulated authentication and stores the user
 * profile in browser localStorage. In a production environment, this should be
 * replaced with a secure backend authentication system (JWT, OAuth, or sessions)
 * and a persistent database.
 * ==============================================================================
 */

// Centralized Storage Keys
const STORAGE_KEYS = {
  USER: 'studyflow_user',
  TASKS: 'studyflow_tasks',
  SESSIONS: 'studyflow_sessions',
  REVIEWS: 'studyflow_reviews',
  INITIALIZED: 'studyflow_initialized'
};

// Motivational Quotes Bank
const MOTIVATIONAL_QUOTES = [
  "Deep focus is the superpower of the 21st-century knowledge worker.",
  "Small daily disciplines compound into massive academic breakthroughs.",
  "You do not rise to the level of your goals, you fall to the level of your systems.",
  "Consistent effort today eliminates last-minute exam panic tomorrow.",
  "Focus on the process of understanding, and top grades will follow naturally.",
  "The secret to getting ahead is getting started with deliberate intention.",
  "Eliminate friction, protect your study window, and master your craft."
];

// Helper: Format Date String to YYYY-MM-DD
function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Format friendly date (e.g. Thursday, October 8, 2026)
function formatFriendlyDate(dateObj = new Date()) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return dateObj.toLocaleDateString(undefined, options);
}

// Helper: Format short date (e.g. Oct 8) using local date components
function formatShortDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return 'Undated';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Helper: Format friendly date from YYYY-MM-DD string
function formatFriendlyDateFromStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return 'Legacy / Undated';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper: Format day of week (e.g. Thu)
function formatDayOfWeek(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

// Helper: Format minutes into "Xh Ym" or "X.Xh"
function formatMinutes(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/// Helper: Generate Unique ID
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// Helper: Set Button Loading State
function setButtonLoading(btn, isLoading, loadingText = 'Processing...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = `<span class="btn-spinner"></span> <span>${loadingText}</span>`;
  } else {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
    }
  }
}

// Helper: Dismiss initial loading screen
function hideAppLoadingScreen() {
  const screen = document.getElementById('app-loading-screen');
  if (screen) {
    screen.classList.add('fade-out');
    setTimeout(() => {
      screen.style.display = 'none';
    }, 350);
  }
}

/* ==============================================================================
   TOAST NOTIFICATION SERVICE
   ============================================================================== */
const Toast = {
  show(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

/* ==============================================================================
   FIRESTORE CLOUD DATABASE SERVICE
   ============================================================================== */
const FirestoreService = {
  getDb() {
    return window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
  },

  getAuth() {
    return window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
  },

  getActiveUid() {
    const authInstance = this.getAuth();
    if (authInstance && authInstance.currentUser) {
      return authInstance.currentUser.uid;
    }
    const user = StorageService.getUser();
    return (user && !user.isDemo && user.uid) ? user.uid : null;
  },

  async getUserProfile(uid) {
    const dbInstance = this.getDb();
    if (!dbInstance || !uid) return null;
    try {
      const doc = await dbInstance.collection('users').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.error('Firestore: failed to get user profile', e);
      return null;
    }
  },

  async saveUserProfile(uid, profile) {
    const dbInstance = this.getDb();
    if (!dbInstance || !uid) return;
    try {
      const data = {
        name: profile.name || '',
        email: profile.email || '',
        uid: uid,
        dailyStudyTarget: profile.dailyStudyTarget || 4.0,
        routine: profile.routine || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await dbInstance.collection('users').doc(uid).set(data, { merge: true });
    } catch (e) {
      console.error('Firestore: failed to save user profile', e);
      Toast.show('Cloud sync failed for profile settings', 'error');
    }
  },

  async saveAllTasks(uid, tasks) {
    const dbInstance = this.getDb();
    if (!dbInstance || !uid) return;
    try {
      const tasksRef = dbInstance.collection('users').doc(uid).collection('tasks');
      const existingSnapshot = await tasksRef.get();
      const currentIds = new Set(tasks.map((t) => t.id));

      const toDelete = [];
      existingSnapshot.forEach((doc) => {
        if (!currentIds.has(doc.id)) {
          toDelete.push(doc.ref);
        }
      });

      const batchLimit = 400;
      let batch = dbInstance.batch();
      let count = 0;

      for (const ref of toDelete) {
        batch.delete(ref);
        count++;
        if (count >= batchLimit) {
          await batch.commit();
          batch = dbInstance.batch();
          count = 0;
        }
      }

      for (const task of tasks) {
        const docRef = tasksRef.doc(task.id);
        batch.set(docRef, {
          ...task,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        count++;
        if (count >= batchLimit) {
          await batch.commit();
          batch = dbInstance.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.error('Firestore: failed to save tasks', e);
      Toast.show('Cloud sync failed for tasks', 'error');
    }
  },

  async saveAllSessions(uid, sessions) {
    const dbInstance = this.getDb();
    if (!dbInstance || !uid) return;
    try {
      const collRef = dbInstance.collection('users').doc(uid).collection('sessions');
      const existingSnapshot = await collRef.get();
      const batch = dbInstance.batch();
      const currentIds = new Set(sessions.map((s) => s.id));

      existingSnapshot.forEach((doc) => {
        if (!currentIds.has(doc.id)) {
          batch.delete(doc.ref);
        }
      });

      sessions.forEach((sess) => {
        const docRef = collRef.doc(sess.id);
        batch.set(docRef, {
          ...sess,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });

      await batch.commit();
    } catch (e) {
      console.error('Firestore: failed to save sessions', e);
      Toast.show('Cloud sync failed for study sessions', 'error');
    }
  },

  async saveAllReviews(uid, reviews) {
    const dbInstance = this.getDb();
    if (!dbInstance || !uid) return;
    try {
      const collRef = dbInstance.collection('users').doc(uid).collection('reviews');
      const existingSnapshot = await collRef.get();
      const batch = dbInstance.batch();
      const currentDates = new Set(reviews.map((r) => r.date));

      existingSnapshot.forEach((doc) => {
        if (!currentDates.has(doc.id)) {
          batch.delete(doc.ref);
        }
      });

      reviews.forEach((rev) => {
        const docRef = collRef.doc(rev.date);
        batch.set(docRef, {
          ...rev,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });

      await batch.commit();
    } catch (e) {
      console.error('Firestore: failed to save reviews', e);
      Toast.show('Cloud sync failed for daily reviews', 'error');
    }
  },

  async clearAllUserData(uid) {
    const dbInstance = this.getDb();
    if (!dbInstance || !uid) return;
    try {
      const tasksSnapshot = await dbInstance.collection('users').doc(uid).collection('tasks').get();
      if (!tasksSnapshot.empty) {
        const b1 = dbInstance.batch();
        tasksSnapshot.forEach((d) => b1.delete(d.ref));
        await b1.commit();
      }

      const sessionsSnapshot = await dbInstance.collection('users').doc(uid).collection('sessions').get();
      if (!sessionsSnapshot.empty) {
        const b2 = dbInstance.batch();
        sessionsSnapshot.forEach((d) => b2.delete(d.ref));
        await b2.commit();
      }

      const reviewsSnapshot = await dbInstance.collection('users').doc(uid).collection('reviews').get();
      if (!reviewsSnapshot.empty) {
        const b3 = dbInstance.batch();
        reviewsSnapshot.forEach((d) => b3.delete(d.ref));
        await b3.commit();
      }

      await dbInstance.collection('users').doc(uid).delete();
    } catch (e) {
      console.error('Firestore: failed to clear user cloud data', e);
    }
  },

  async loadAllUserData(uid) {
    const dbInstance = this.getDb();
    const authInstance = this.getAuth();
    if (!dbInstance || !uid) return null;

    try {
      // 1. User Profile
      const userDoc = await dbInstance.collection('users').doc(uid).get();
      let profile = null;

      if (userDoc.exists) {
        profile = userDoc.data();
      } else {
        const localUser = StorageService.getUser();
        const fbUser = authInstance ? authInstance.currentUser : null;
        profile = {
          name: (localUser && localUser.uid === uid && localUser.name) ||
                (fbUser && fbUser.displayName) ||
                (fbUser && fbUser.email ? fbUser.email.split('@')[0] : 'Student'),
          email: (fbUser && fbUser.email) || '',
          uid: uid,
          dailyStudyTarget: (localUser && localUser.uid === uid && localUser.dailyStudyTarget) || 4.0,
          routine: (localUser && localUser.uid === uid && localUser.routine) || null
        };
        await this.saveUserProfile(uid, profile);
      }

      StorageService.setUser(profile, false);

      // 2. Tasks
      const tasksSnapshot = await dbInstance.collection('users').doc(uid).collection('tasks').get();
      let tasks = [];
      if (!tasksSnapshot.empty) {
        tasksSnapshot.forEach((doc) => tasks.push(doc.data()));
      } else {
        const localTasks = StorageService.getTasks();
        if (localTasks.length > 0) {
          tasks = localTasks;
          await this.saveAllTasks(uid, tasks);
        }
      }
      StorageService.setTasks(tasks, false);

      // 3. Sessions
      const sessionsSnapshot = await dbInstance.collection('users').doc(uid).collection('sessions').get();
      let sessions = [];
      if (!sessionsSnapshot.empty) {
        sessionsSnapshot.forEach((doc) => sessions.push(doc.data()));
        sessions.sort((a, b) => (b.date > a.date ? 1 : -1));
      } else {
        const localSessions = StorageService.getSessions();
        if (localSessions.length > 0) {
          sessions = localSessions;
          await this.saveAllSessions(uid, sessions);
        }
      }
      StorageService.setSessions(sessions, false);

      // 4. Reviews
      const reviewsSnapshot = await dbInstance.collection('users').doc(uid).collection('reviews').get();
      let reviews = [];
      if (!reviewsSnapshot.empty) {
        reviewsSnapshot.forEach((doc) => reviews.push(doc.data()));
        reviews.sort((a, b) => (b.date > a.date ? 1 : -1));
      } else {
        const localReviews = StorageService.getReviews();
        if (localReviews.length > 0) {
          reviews = localReviews;
          await this.saveAllReviews(uid, reviews);
        }
      }
      StorageService.setReviews(reviews, false);

      localStorage.setItem(StorageService.getDataKey(STORAGE_KEYS.INITIALIZED), 'true');
      return profile;
    } catch (e) {
      console.error('Firestore: error loading user data', e);
      Toast.show('Cloud sync note: using cached offline data', 'info');
      return null;
    }
  }
};

/* ==============================================================================
   DATA STORAGE SERVICE (Local Cache + Cloud Sync Bridge)
   ============================================================================== */
const StorageService = {
  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to parse user data from localStorage', e);
      return null;
    }
  },

  setUser(user, syncToCloud = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (syncToCloud && user && user.uid && !user.isDemo) {
        FirestoreService.saveUserProfile(user.uid, user);
      }
    } catch (e) {
      console.error('Failed to save user data', e);
    }
  },

  isDemoMode() {
    const user = this.getUser();
    return !!(user && (user.isDemo || !user.uid));
  },

  getDataKey(key) {
    const user = this.getUser();
    if (user && user.uid && !user.isDemo) {
      return `${key}_${user.uid}`;
    }
    return key;
  },

  getTasks() {
    try {
      const data = localStorage.getItem(this.getDataKey(STORAGE_KEYS.TASKS));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse tasks', e);
      return [];
    }
  },

  setTasks(tasks, syncToCloud = true) {
    try {
      localStorage.setItem(this.getDataKey(STORAGE_KEYS.TASKS), JSON.stringify(tasks));
      const user = this.getUser();
      if (syncToCloud && user && user.uid && !user.isDemo) {
        FirestoreService.saveAllTasks(user.uid, tasks);
      }
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  },

  getSessions() {
    try {
      const data = localStorage.getItem(this.getDataKey(STORAGE_KEYS.SESSIONS));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse sessions', e);
      return [];
    }
  },

  setSessions(sessions, syncToCloud = true) {
    try {
      localStorage.setItem(this.getDataKey(STORAGE_KEYS.SESSIONS), JSON.stringify(sessions));
      const user = this.getUser();
      if (syncToCloud && user && user.uid && !user.isDemo) {
        FirestoreService.saveAllSessions(user.uid, sessions);
      }
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  },

  getReviews() {
    try {
      const data = localStorage.getItem(this.getDataKey(STORAGE_KEYS.REVIEWS));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse reviews', e);
      return [];
    }
  },

  setReviews(reviews, syncToCloud = true) {
    try {
      localStorage.setItem(this.getDataKey(STORAGE_KEYS.REVIEWS), JSON.stringify(reviews));
      const user = this.getUser();
      if (syncToCloud && user && user.uid && !user.isDemo) {
        FirestoreService.saveAllReviews(user.uid, reviews);
      }
    } catch (e) {
      console.error('Failed to save reviews', e);
    }
  },

  clearActiveUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearAllData() {
    const user = this.getUser();
    const uid = user && user.uid;
    if (uid) {
      localStorage.removeItem(`${STORAGE_KEYS.TASKS}_${uid}`);
      localStorage.removeItem(`${STORAGE_KEYS.SESSIONS}_${uid}`);
      localStorage.removeItem(`${STORAGE_KEYS.REVIEWS}_${uid}`);
      localStorage.removeItem(`${STORAGE_KEYS.INITIALIZED}_${uid}`);
    }
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  },

  // Seed realistic demo data for presentations & testing
  seedDemoData(force = false) {
    const initializedKey = this.getDataKey(STORAGE_KEYS.INITIALIZED);

    if (!force && localStorage.getItem(initializedKey)) {
      return;
    }

    const today = getTodayDateString(0);
    const yesterday = getTodayDateString(-1);
    const twoDaysAgo = getTodayDateString(-2);
    const threeDaysAgo = getTodayDateString(-3);
    const fourDaysAgo = getTodayDateString(-4);
    const fiveDaysAgo = getTodayDateString(-5);

    // Default User
    const defaultUser = {
      name: 'Alex Mercer',
      email: 'alex.mercer@college.edu',
      isDemo: true,
      dailyStudyTarget: 4.0,
      routine: {
        wake: '06:30',
        workStart: '09:00',
        workEnd: '16:00',
        studyStart: '18:00',
        studyEnd: '22:00',
        sleep: '23:30'
      }
    };

    // Realistic Demo Tasks: Active Today Tasks + Archived Past Tasks
    const demoTasks = [
      // Today's Tasks (Active, unarchived)
      {
        id: generateId('task'),
        title: 'Implement Dijkstra & Bellman-Ford Shortest Path in C++',
        category: 'Computer Science',
        priority: 'High',
        estimatedMinutes: 60,
        completed: true,
        date: today,
        archived: false,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('task'),
        title: 'Review Operating Systems: Banker’s Algorithm for Deadlocks',
        category: 'Computer Science',
        priority: 'High',
        estimatedMinutes: 45,
        completed: false,
        date: today,
        archived: false,
        createdAt: new Date().toISOString()
      },
      {
        id: generateId('task'),
        title: 'Complete Problem Set 4 on Eigenvalues and Diagonalization',
        category: 'Mathematics',
        priority: 'Medium',
        estimatedMinutes: 50,
        completed: false,
        date: today,
        archived: false,
        createdAt: new Date().toISOString()
      },
      // Archived Yesterday Tasks (Completed & Unfinished)
      {
        id: generateId('task'),
        title: 'Design Database Schema for Semester DBMS Project',
        category: 'Projects',
        priority: 'High',
        estimatedMinutes: 90,
        completed: true,
        date: yesterday,
        archived: true,
        archivedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: generateId('task'),
        title: 'Submit Networking Lab Report: Wireshark Packet Inspection',
        category: 'Assignments',
        priority: 'Medium',
        estimatedMinutes: 40,
        completed: false,
        date: yesterday,
        archived: true,
        archivedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      // Archived Two Days Ago Tasks (Completed & Unfinished)
      {
        id: generateId('task'),
        title: 'Read Research Paper on Modern CPU Branch Predictors',
        category: 'General',
        priority: 'Low',
        estimatedMinutes: 30,
        completed: true,
        date: twoDaysAgo,
        archived: true,
        archivedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: generateId('task'),
        title: 'Practice Calculus Integration Techniques & Taylor Series',
        category: 'Mathematics',
        priority: 'Medium',
        estimatedMinutes: 45,
        completed: false,
        date: twoDaysAgo,
        archived: true,
        archivedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    // Realistic Demo Study Sessions
    const demoSessions = [
      { id: generateId('sess'), subject: 'Computer Science (Algorithms)', duration: 60, date: today },
      { id: generateId('sess'), subject: 'Operating Systems', duration: 45, date: today },
      { id: generateId('sess'), subject: 'Mathematics (Linear Algebra)', duration: 45, date: today },
      { id: generateId('sess'), subject: 'DBMS Project Design', duration: 120, date: yesterday },
      { id: generateId('sess'), subject: 'Computer Science', duration: 90, date: yesterday },
      { id: generateId('sess'), subject: 'Mathematics (Calculus)', duration: 110, date: twoDaysAgo },
      { id: generateId('sess'), subject: 'Computer Networks', duration: 75, date: twoDaysAgo },
      { id: generateId('sess'), subject: 'Operating Systems', duration: 150, date: threeDaysAgo },
      { id: generateId('sess'), subject: 'Computer Science', duration: 120, date: fourDaysAgo },
      { id: generateId('sess'), subject: 'Algorithms Revision', duration: 180, date: fiveDaysAgo }
    ];

    // Demo Reviews
    const demoReviews = [
      {
        date: yesterday,
        rating: 9,
        reflection: 'Excellent focus block on SQL queries and normalization. Cleared 2 major blockers.',
        tomorrowPriority: 'Finish Dijkstra code and start OS Banker algorithm revision.'
      },
      {
        date: twoDaysAgo,
        rating: 8,
        reflection: 'Solid progress in Linear Algebra. Had minor distraction in the afternoon.',
        tomorrowPriority: 'Deep dive into Database relations and schema constraints.'
      }
    ];

    // Set default user ONLY if studyflow_user does not already exist
    const existingUser = this.getUser();
    if (!existingUser) {
      this.setUser(defaultUser, false);
    }
    this.setTasks(demoTasks, !existingUser?.isDemo);
    this.setSessions(demoSessions, !existingUser?.isDemo);
    this.setReviews(demoReviews, !existingUser?.isDemo);
    localStorage.setItem(initializedKey, 'true');
  }
};

/* ==============================================================================
   TASK ARCHIVING & DAILY LIFECYCLE SERVICE
   ============================================================================== */
const TaskArchiveService = {
  currentAppDate: getTodayDateString(0),
  rolloverTimer: null,

  init() {
    this.currentAppDate = getTodayDateString(0);
    this.checkAndArchiveTasks();

    // Listen for tab visibility changes (e.g. returning to tab next morning)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkDateRollover();
      }
    });

    // Listen for window focus
    window.addEventListener('focus', () => {
      this.checkDateRollover();
    });

    // Periodic check every 30 seconds for live midnight rollover
    if (this.rolloverTimer) clearInterval(this.rolloverTimer);
    this.rolloverTimer = setInterval(() => {
      this.checkDateRollover();
    }, 30000);
  },

  /**
   * Idempotently archives tasks from previous calendar dates.
   * Preserves completion status, titles, categories, priorities, estimatedMinutes, etc.
   * Migrates legacy tasks without guessing dates.
   * Returns { archivedCount, modified }
   */
  checkAndArchiveTasks() {
    const todayStr = getTodayDateString(0);
    const tasks = StorageService.getTasks();
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return { archivedCount: 0, modified: false };
    }

    let modified = false;
    let archivedCount = 0;
    const nowIso = new Date().toISOString();

    const updatedTasks = tasks.map((task) => {
      let t = { ...task };

      // 1. Safe backward-compatible migration for undated/legacy tasks
      if (!t.date || typeof t.date !== 'string' || !t.date.trim()) {
        if (t.createdAt && typeof t.createdAt === 'string') {
          const parsed = t.createdAt.substring(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
            t.date = parsed;
          }
        }
        if (!t.date) {
          // Date cannot be reliably determined. Do NOT guess it belongs to today.
          // Preserve as legacy/undated task in Task History.
          t.date = null;
          t.isUndated = true;
          if (t.archived !== true) {
            t.archived = true;
            t.archivedAt = t.archivedAt || nowIso;
            modified = true;
            archivedCount++;
          }
          return t;
        }
      }

      // 2. Daily task archiving: tasks from previous calendar dates move to history
      if (t.date < todayStr) {
        if (!t.archived) {
          t.archived = true;
          t.archivedAt = t.archivedAt || nowIso;
          modified = true;
          archivedCount++;
        }
      } else if (t.date === todayStr) {
        // Belongs to today: active task, must not be archived
        if (t.archived !== false) {
          t.archived = false;
          modified = true;
        }
      }

      return t;
    });

    if (modified) {
      StorageService.setTasks(updatedTasks, true);
    }

    return { archivedCount, modified };
  },

  /**
   * Checks if calendar date has changed (e.g. crossing midnight).
   * If changed, triggers archiving and refreshes all active controllers.
   */
  checkDateRollover() {
    const freshDate = getTodayDateString(0);
    if (freshDate !== this.currentAppDate) {
      console.log(`StudyFlow: Date changed from ${this.currentAppDate} to ${freshDate}. Running automatic task archiving...`);
      this.currentAppDate = freshDate;
      const { archivedCount } = this.checkAndArchiveTasks();
      if (archivedCount > 0) {
        Toast.show(`📅 New day started (${formatShortDate(freshDate)}). ${archivedCount} task${archivedCount > 1 ? 's' : ''} moved to Task History.`, 'info');
      }
      // Re-render UI components for the new day
      DashboardController.render();
      TaskController.render();
      ReviewController.render();
      ProgressController.render();
    } else {
      // Even if date didn't change, ensure any pending tasks from previous days are archived
      this.checkAndArchiveTasks();
    }
  }
};

/* ==============================================================================
   AUTH & ROUTINE SETUP CONTROLLER
   ============================================================================== */
const AuthSetupController = {
  init() {
    const authForm = document.getElementById('auth-form');
    const btnQuickDemo = document.getElementById('btn-quick-demo');
    const setupForm = document.getElementById('setup-form');
    const setupTargetSlider = document.getElementById('setup-target');
    const setupTargetDisplay = document.getElementById('setup-target-display');
    const btnQuickLogout = document.getElementById('btn-quick-logout');
    const btnSignIn = document.getElementById('btn-signin');
    const btnSignUp = document.getElementById('btn-signup');
    const btnForgot = document.getElementById('btn-forgot-password');

    // Preset Buttons
    const presetCollege = document.getElementById('preset-college');
    const presetExam = document.getElementById('preset-exam');
    const presetWeekend = document.getElementById('preset-weekend');

    if (setupTargetSlider && setupTargetDisplay) {
      setupTargetSlider.addEventListener('input', (e) => {
        setupTargetDisplay.textContent = `${parseFloat(e.target.value).toFixed(1)} Hours`;
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignIn();
      });
    }

    if (btnSignIn) {
      btnSignIn.addEventListener('click', () => this.handleSignIn());
    }

    if (btnSignUp) {
      btnSignUp.addEventListener('click', () => this.handleSignUp());
    }

    if (btnForgot) {
      btnForgot.addEventListener('click', () => this.handleForgotPassword());
    }

    if (btnQuickDemo) {
      btnQuickDemo.addEventListener('click', () => this.handleQuickDemo());
    }

    if (setupForm) {
      setupForm.addEventListener('submit', (e) => this.handleSetupSubmit(e));
    }

    if (btnQuickLogout) {
      btnQuickLogout.addEventListener('click', () => this.logout());
    }

    // Presets
    if (presetCollege) {
      presetCollege.addEventListener('click', () => {
        document.getElementById('setup-wake').value = '06:30';
        document.getElementById('setup-work-start').value = '09:00';
        document.getElementById('setup-work-end').value = '16:00';
        document.getElementById('setup-study-start').value = '18:00';
        document.getElementById('setup-study-end').value = '22:00';
        document.getElementById('setup-sleep').value = '23:30';
        setupTargetSlider.value = '4.0';
        setupTargetDisplay.textContent = '4.0 Hours';
        Toast.show('Applied Typical College Day preset', 'info');
      });
    }

    if (presetExam) {
      presetExam.addEventListener('click', () => {
        document.getElementById('setup-wake').value = '06:00';
        document.getElementById('setup-work-start').value = '09:00';
        document.getElementById('setup-work-end').value = '14:00';
        document.getElementById('setup-study-start').value = '15:30';
        document.getElementById('setup-study-end').value = '23:00';
        document.getElementById('setup-sleep').value = '23:45';
        setupTargetSlider.value = '6.0';
        setupTargetDisplay.textContent = '6.0 Hours';
        Toast.show('Applied Exam Sprint preset (6h target)', 'info');
      });
    }

    if (presetWeekend) {
      presetWeekend.addEventListener('click', () => {
        document.getElementById('setup-wake').value = '08:00';
        document.getElementById('setup-work-start').value = '10:00';
        document.getElementById('setup-work-end').value = '12:00';
        document.getElementById('setup-study-start').value = '14:00';
        document.getElementById('setup-study-end').value = '19:00';
        document.getElementById('setup-sleep').value = '00:00';
        setupTargetSlider.value = '4.5';
        setupTargetDisplay.textContent = '4.5 Hours';
        Toast.show('Applied Flexible Study Day preset', 'info');
      });
    }
  },

  checkCurrentState() {
    const user = StorageService.getUser();
    const authScreen = document.getElementById('auth-screen');
    const setupScreen = document.getElementById('setup-screen');
    const appScreen = document.getElementById('app-screen');

    if (!user) {
      authScreen.style.display = 'flex';
      setupScreen.style.display = 'none';
      appScreen.style.display = 'none';
    } else if (!user.routine) {
      authScreen.style.display = 'none';
      setupScreen.style.display = 'flex';
      appScreen.style.display = 'none';
    } else {
      authScreen.style.display = 'none';
      setupScreen.style.display = 'none';
      appScreen.style.display = 'flex';
      App.bootstrap();
    }
  },

  resetUIState() {
    const previewList = document.getElementById('dash-task-preview-list');
    if (previewList) previewList.innerHTML = '';
    const fullList = document.getElementById('task-full-list');
    if (fullList) fullList.innerHTML = '';
    const sessList = document.getElementById('session-history-list');
    if (sessList) sessList.innerHTML = '';
    const revList = document.getElementById('past-reviews-list');
    if (revList) revList.innerHTML = '';
    const chart = document.getElementById('bar-chart-weekly');
    if (chart) chart.innerHTML = '';
    const subjList = document.getElementById('subject-breakdown-list');
    if (subjList) subjList.innerHTML = '';
    if (typeof TimerController !== 'undefined' && TimerController.reset) {
      TimerController.reset();
    }
  },

  async handleSignIn() {
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const btnSignIn = document.getElementById('btn-signin');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
      Toast.show('Please enter both your email and password', 'error');
      return;
    }

    setButtonLoading(btnSignIn, true, 'Signing in...');

    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      const firebaseUser = credential.user;

      Toast.show('Signed in! Loading your study data...', 'info');
      await FirestoreService.loadAllUserData(firebaseUser.uid);

      Toast.show('Welcome back!', 'success');
      this.checkCurrentState();
      App.bootstrap();
    } catch (error) {
      console.error('Sign-in error:', error);
      const messages = {
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/wrong-password': 'Incorrect email or password.',
        'auth/user-not-found': 'No account found with this email. Create an account first.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.'
      };
      Toast.show(messages[error.code] || 'Could not sign in. Please try again.', 'error');
    } finally {
      setButtonLoading(btnSignIn, false);
    }
  },

  async handleSignUp() {
    const nameInput = document.getElementById('auth-name');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const btnSignUp = document.getElementById('btn-signup');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!name || !email || !password) {
      Toast.show('Please fill in your name, email, and password', 'error');
      return;
    }

    if (password.length < 6) {
      Toast.show('Password must be at least 6 characters long', 'error');
      return;
    }

    setButtonLoading(btnSignUp, true, 'Creating Account...');

    try {
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = credential.user;

      if (firebaseUser.updateProfile) {
        await firebaseUser.updateProfile({ displayName: name });
      }

      const profile = {
        name: name,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        dailyStudyTarget: 4.0,
        routine: null
      };

      await FirestoreService.saveUserProfile(firebaseUser.uid, profile);
      StorageService.setUser(profile, false);

      Toast.show(`Account created! Welcome, ${name}!`, 'success');
      this.checkCurrentState();
      App.bootstrap();
    } catch (error) {
      console.error('Sign-up error:', error);
      const messages = {
        'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.'
      };
      Toast.show(messages[error.code] || 'Could not create account. Please try again.', 'error');
    } finally {
      setButtonLoading(btnSignUp, false);
    }
  },

  async handleForgotPassword() {
    const emailInput = document.getElementById('auth-email');
    let email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      email = prompt('Enter your registered email address to receive a password reset link:');
      if (email) email = email.trim();
    }

    if (!email) {
      Toast.show('Please enter your email to reset your password', 'info');
      if (emailInput) emailInput.focus();
      return;
    }

    try {
      Toast.show('Sending password reset email...', 'info');
      await auth.sendPasswordResetEmail(email);
      Toast.show(`Password reset link sent to ${email}! Check your inbox.`, 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      const messages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/network-request-failed': 'Network error. Check your internet connection.'
      };
      Toast.show(messages[error.code] || 'Could not send reset email. Please try again.', 'error');
    }
  },

  handleQuickDemo() {
    const defaultUser = {
      name: 'Alex Mercer',
      email: 'alex.mercer@college.edu',
      isDemo: true,
      dailyStudyTarget: 4.0,
      routine: {
        wake: '06:30',
        workStart: '09:00',
        workEnd: '16:00',
        studyStart: '18:00',
        studyEnd: '22:00',
        sleep: '23:30'
      }
    };

    StorageService.setUser(defaultUser, false);

    const hasExistingTasks = StorageService.getTasks().length > 0;
    const hasExistingSessions = StorageService.getSessions().length > 0;
    const hasExistingReviews = StorageService.getReviews().length > 0;

    if (!hasExistingTasks && !hasExistingSessions && !hasExistingReviews) {
      StorageService.seedDemoData(false);
    }

    Toast.show('Loaded demo profile & sample study schedule!', 'success');
    this.checkCurrentState();
    App.bootstrap();
  },

  async handleSetupSubmit(e) {
    e.preventDefault();
    const user = StorageService.getUser() || {
      name: 'Student',
      email: 'student@college.edu'
    };

    const wake = document.getElementById('setup-wake').value;
    const workStart = document.getElementById('setup-work-start').value;
    const workEnd = document.getElementById('setup-work-end').value;
    const studyStart = document.getElementById('setup-study-start').value;
    const studyEnd = document.getElementById('setup-study-end').value;
    const sleep = document.getElementById('setup-sleep').value;
    const target = parseFloat(document.getElementById('setup-target').value) || 4.0;

    user.routine = { wake, workStart, workEnd, studyStart, studyEnd, sleep };
    user.dailyStudyTarget = target;

    StorageService.setUser(user, true);

    const existingTasks = StorageService.getTasks();
    if (existingTasks.length === 0) {
      StorageService.seedDemoData(false);
    }

    Toast.show('Daily schedule saved successfully!', 'success');
    this.checkCurrentState();
    App.bootstrap();
  },

  async logout() {
    if (!confirm('Log out of StudyFlow?')) return;

    try {
      if (typeof auth !== 'undefined' && auth && auth.currentUser) {
        await auth.signOut();
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    }

    StorageService.clearActiveUser();
    this.resetUIState();
    Toast.show('Logged out successfully', 'info');
    this.checkCurrentState();
  }
};

/* ==============================================================================
   NAVIGATION CONTROLLER
   ============================================================================== */
const NavigationController = {
  activeView: 'dashboard',

  init() {
    const desktopNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const mobileBottomItems = document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item');
    const profileBtn = document.getElementById('mobile-profile-btn');

    desktopNavItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.switchView(view);
      });
    });

    mobileBottomItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.switchView(view);
      });
    });

    if (profileBtn) {
      profileBtn.addEventListener('click', () => this.switchView('settings'));
    }

    // Dashboard shortcut buttons
    const btnDashTasks = document.getElementById('btn-dash-view-all-tasks');
    if (btnDashTasks) {
      btnDashTasks.addEventListener('click', () => this.switchView('tasks'));
    }

    const btnDashTimer = document.getElementById('btn-dash-jump-timer');
    if (btnDashTimer) {
      btnDashTimer.addEventListener('click', () => {
        const subj = document.getElementById('dash-quick-subject').value.trim();
        if (subj) {
          document.getElementById('timer-subject-input').value = subj;
          document.getElementById('timer-subject-display').textContent = subj;
        }
        this.switchView('study');
      });
    }

    const btnDashReview = document.getElementById('btn-dash-open-review');
    if (btnDashReview) {
      btnDashReview.addEventListener('click', () => this.switchView('review'));
    }

    const btnTopbarStudy = document.getElementById('btn-topbar-study');
    if (btnTopbarStudy) {
      btnTopbarStudy.addEventListener('click', () => this.switchView('study'));
    }
  },

  switchView(viewId) {
    if (!viewId) return;
    this.activeView = viewId;

    // Update active class on views
    document.querySelectorAll('.content-view').forEach((el) => {
      el.classList.remove('active');
    });
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update desktop sidebar buttons
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
      if (btn.getAttribute('data-view') === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update mobile bottom nav
    document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach((btn) => {
      if (btn.getAttribute('data-view') === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Refresh view specific logic
    if (viewId === 'dashboard') DashboardController.render();
    if (viewId === 'tasks') TaskController.render();
    if (viewId === 'study') TimerController.render();
    if (viewId === 'progress') ProgressController.render();
    if (viewId === 'review') ReviewController.render();
    if (viewId === 'settings') SettingsController.render();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

/* ==============================================================================
   DASHBOARD CONTROLLER
   ============================================================================== */
const DashboardController = {
  init() {
    const btnRefreshQuote = document.getElementById('btn-refresh-quote');
    if (btnRefreshQuote) {
      btnRefreshQuote.addEventListener('click', () => this.rotateQuote());
    }
  },

  rotateQuote() {
    const quoteEl = document.getElementById('quote-text');
    if (!quoteEl) return;
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    quoteEl.textContent = `"${MOTIVATIONAL_QUOTES[randomIdx]}"`;
  },

  render() {
    const user = StorageService.getUser();
    if (!user) return;

    const todayStr = getTodayDateString(0);
    const friendlyDate = formatFriendlyDate();

    // 1. Topbar Greeting & Date
    const greetingEl = document.getElementById('topbar-greeting');
    const dateEl = document.getElementById('topbar-date');
    const mobileDateBadge = document.getElementById('mobile-date-badge');
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const mobileUserInitials = document.getElementById('mobile-user-initials');

    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17) timeGreeting = 'Good evening';

    const rawName = (user.name || 'Student').trim();
    const nameWords = rawName.split(/\s+/).filter(Boolean);
    const firstName = nameWords.length > 0 ? nameWords[0] : 'Student';

    if (greetingEl) greetingEl.textContent = `${timeGreeting}, ${firstName} 👋`;
    if (dateEl) dateEl.textContent = friendlyDate;
    if (mobileDateBadge) mobileDateBadge.textContent = formatShortDate(todayStr);

    let initials = 'ST';
    if (nameWords.length === 1) {
      initials = nameWords[0].substring(0, 2).toUpperCase();
    } else if (nameWords.length > 1) {
      initials = (nameWords[0][0] + nameWords[nameWords.length - 1][0]).toUpperCase();
    }

    if (sidebarUserName) sidebarUserName.textContent = rawName;
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (mobileUserInitials) mobileUserInitials.textContent = initials;

    // 2. Study Time KPI
    const sessions = StorageService.getSessions();
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    const todayStudyMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const todayStudyHours = todayStudyMinutes / 60;
    const targetHours = user.dailyStudyTarget || 4.0;
    const studyPct = Math.min(100, Math.round((todayStudyHours / targetHours) * 100));
    const remainingHours = Math.max(0, targetHours - todayStudyHours);

    const studyCompletedEl = document.getElementById('dash-study-completed');
    const studyTargetEl = document.getElementById('dash-study-target');
    const studyBarEl = document.getElementById('dash-study-bar');
    const studyPctEl = document.getElementById('dash-study-pct');
    const studyRemainingEl = document.getElementById('dash-study-remaining');

    if (studyCompletedEl) studyCompletedEl.textContent = `${todayStudyHours.toFixed(1)}h`;
    if (studyTargetEl) studyTargetEl.textContent = `${targetHours.toFixed(1)}h`;
    if (studyBarEl) studyBarEl.style.width = `${studyPct}%`;
    if (studyPctEl) studyPctEl.textContent = `${studyPct}% reached`;
    if (studyRemainingEl) {
      studyRemainingEl.textContent = remainingHours === 0 ? 'Goal achieved! 🎉' : `${remainingHours.toFixed(1)}h to goal`;
    }

    // 3. Task Completion KPI
    const allTasks = StorageService.getTasks();
    const todayTasks = allTasks.filter((t) => t.date === todayStr && !t.archived);
    const completedTodayCount = todayTasks.filter((t) => t.completed).length;
    const totalTodayCount = todayTasks.length;
    const pendingTodayCount = totalTodayCount - completedTodayCount;
    const taskPct = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

    const taskCompletedEl = document.getElementById('dash-tasks-completed');
    const taskTotalEl = document.getElementById('dash-tasks-total');
    const taskBarEl = document.getElementById('dash-task-bar');
    const taskPctEl = document.getElementById('dash-task-pct');
    const taskPendingEl = document.getElementById('dash-tasks-pending-count');
    const sidebarBadge = document.getElementById('sidebar-pending-badge');

    if (taskCompletedEl) taskCompletedEl.textContent = completedTodayCount;
    if (taskTotalEl) taskTotalEl.textContent = totalTodayCount;
    if (taskBarEl) taskBarEl.style.width = `${taskPct}%`;
    if (taskPctEl) taskPctEl.textContent = `${taskPct}% completed`;
    if (taskPendingEl) taskPendingEl.textContent = `${pendingTodayCount} pending`;
    if (sidebarBadge) sidebarBadge.textContent = pendingTodayCount;

    // 4. Streak Calculation
    const streakDays = ProgressController.calculateStreak(sessions);
    const streakCountEl = document.getElementById('dash-streak-count');
    const streakDotsEl = document.getElementById('dash-streak-dots');

    if (streakCountEl) streakCountEl.textContent = streakDays;
    if (streakDotsEl) {
      streakDotsEl.innerHTML = '';
      for (let i = 0; i < 7; i++) {
        const dot = document.createElement('div');
        dot.className = `streak-dot ${i < streakDays ? 'active' : ''}`;
        streakDotsEl.appendChild(dot);
      }
    }

    // 5. Productivity Score (Flow Index)
    const compositeScore = Math.min(100, Math.round(studyPct * 0.5 + taskPct * 0.5));
    const flowScoreEl = document.getElementById('dash-flow-score');
    const flowBarEl = document.getElementById('dash-flow-bar');
    const flowBadgeEl = document.getElementById('dash-flow-badge');

    if (flowScoreEl) flowScoreEl.textContent = compositeScore;
    if (flowBarEl) flowBarEl.style.width = `${compositeScore}%`;
    if (flowBadgeEl) {
      if (compositeScore >= 80) flowBadgeEl.textContent = 'Peak Flow 🔥';
      else if (compositeScore >= 50) flowBadgeEl.textContent = 'Steady Flow ⚡';
      else flowBadgeEl.textContent = 'Building Pace ⏳';
    }

    // 6. Routine Timeline Visualization
    this.renderRoutineTimeline(user.routine);

    // 7. Today's Priority Tasks List
    this.renderTaskPreview(todayTasks);

    // 8. Daily Review Status
    this.renderReviewWidget(todayStr, todayStudyHours, completedTodayCount, totalTodayCount);
  },

  renderRoutineTimeline(routine) {
    if (!routine) return;

    const timelineBar = document.getElementById('timeline-bar-segments');
    const blocksList = document.getElementById('timeline-blocks-list');
    const phaseText = document.getElementById('timeline-phase-text');

    if (!timelineBar || !blocksList) return;

    // Time helper in minutes from midnight
    const toMins = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const wakeM = toMins(routine.wake);
    const workStartM = toMins(routine.workStart);
    const workEndM = toMins(routine.workEnd);
    const studyStartM = toMins(routine.studyStart);
    const studyEndM = toMins(routine.studyEnd);
    const sleepM = toMins(routine.sleep);

    let activePhase = 'Free Time / Break';
    if (currentMins >= wakeM && currentMins < workStartM) activePhase = 'Morning Routine';
    else if (currentMins >= workStartM && currentMins < workEndM) activePhase = 'College / Work Window';
    else if (currentMins >= workEndM && currentMins < studyStartM) activePhase = 'Evening Downtime';
    else if (currentMins >= studyStartM && currentMins < studyEndM) activePhase = 'Dedicated Study Window 🎯';
    else if (currentMins >= studyEndM && currentMins < sleepM) activePhase = 'Pre-Sleep Wind Down';
    else activePhase = 'Rest & Sleep Cycle 🌙';

    if (phaseText) phaseText.textContent = activePhase;

    // Timeline bar segments
    timelineBar.innerHTML = `
      <div class="timeline-segment wake" style="flex: 2;" title="Wake Up: ${routine.wake}"></div>
      <div class="timeline-segment college" style="flex: 7;" title="College / Work: ${routine.workStart} - ${routine.workEnd}"></div>
      <div class="timeline-segment study" style="flex: 4;" title="Study Block: ${routine.studyStart} - ${routine.studyEnd}"></div>
      <div class="timeline-segment sleep" style="flex: 6;" title="Sleep: ${routine.sleep}"></div>
    `;

    // Blocks list
    blocksList.innerHTML = `
      <div class="timeline-block-item ${currentMins >= wakeM && currentMins < workStartM ? 'active' : ''}">
        <span class="block-tag text-blue">Wake Up</span>
        <span class="block-time">${routine.wake}</span>
        <span class="block-label">Morning Routine</span>
      </div>
      <div class="timeline-block-item ${currentMins >= workStartM && currentMins < workEndM ? 'active' : ''}">
        <span class="block-tag text-amber">College / Work</span>
        <span class="block-time">${routine.workStart} - ${routine.workEnd}</span>
        <span class="block-label">Academics & Labs</span>
      </div>
      <div class="timeline-block-item ${currentMins >= studyStartM && currentMins < studyEndM ? 'active' : ''}">
        <span class="block-tag text-emerald">Study Window</span>
        <span class="block-time">${routine.studyStart} - ${routine.studyEnd}</span>
        <span class="block-label">Deep Work Session</span>
      </div>
      <div class="timeline-block-item ${currentMins >= sleepM || currentMins < wakeM ? 'active' : ''}">
        <span class="block-tag text-purple">Sleep</span>
        <span class="block-time">${routine.sleep}</span>
        <span class="block-label">Recovery & Rest</span>
      </div>
    `;
  },

  renderTaskPreview(tasks) {
    const listEl = document.getElementById('dash-task-preview-list');
    const pendingTextEl = document.getElementById('dash-preview-pending-text');
    if (!listEl) return;

    // Filter pending first, then high priority
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    });

    const pendingCount = tasks.filter((t) => !t.completed).length;
    if (pendingTextEl) {
      pendingTextEl.textContent = `${pendingCount} pending task${pendingCount === 1 ? '' : 's'}`;
    }

    const previewItems = sorted.slice(0, 4);

    if (previewItems.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">
          No active tasks. Add one using the top button!
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    previewItems.forEach((task) => {
      const row = document.createElement('div');
      row.className = `dash-task-row ${task.completed ? 'completed' : ''}`;

      const priorityBadgeClass =
        task.priority === 'High' ? 'priority-high' : task.priority === 'Medium' ? 'priority-medium' : 'priority-low';

      row.innerHTML = `
        <div class="dash-task-left">
          <label class="custom-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
            <span class="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </label>
          <span class="dash-task-title">${task.title}</span>
        </div>
        <span class="meta-pill ${priorityBadgeClass}">${task.priority}</span>
      `;

      const checkbox = row.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        TaskController.toggleComplete(task.id);
      });

      listEl.appendChild(row);
    });
  },

  renderReviewWidget(todayStr, studyHours, completed, total) {
    const reviews = StorageService.getReviews();
    const todayReview = reviews.find((r) => r.date === todayStr);

    const pill = document.getElementById('dash-review-status-pill');
    const hrsEl = document.getElementById('dash-review-hrs');
    const doneEl = document.getElementById('dash-review-done');

    if (hrsEl) hrsEl.textContent = `${studyHours.toFixed(1)}h`;
    if (doneEl) doneEl.textContent = `${completed} / ${total}`;

    if (pill) {
      if (todayReview) {
        pill.textContent = `Completed (${todayReview.rating}/10)`;
        pill.className = 'status-pill-small completed';
      } else {
        pill.textContent = 'Pending';
        pill.className = 'status-pill-small';
      }
    }
  }
};

/* ==============================================================================
   TASK MANAGEMENT CONTROLLER (Today's Tasks & Task History)
   ============================================================================== */
const TaskController = {
  currentTab: 'today', // 'today' | 'history'

  // Today view filters
  todayFilterStatus: 'all', // 'all' | 'pending' | 'completed'
  todayCategory: 'all',
  todayPriority: 'all',

  // History view filters
  historyFilterStatus: 'all', // 'all' | 'completed' | 'incomplete'
  historyFilterDate: 'all', // 'all' | 'YYYY-MM-DD' | 'undated'
  historyCategory: 'all',

  init() {
    // Modal controls
    const btnOpenModal = document.getElementById('btn-open-add-task-modal');
    const btnTopbarNewTask = document.getElementById('btn-topbar-new-task');
    const btnCloseModal = document.getElementById('btn-close-task-modal');
    const btnCancelModal = document.getElementById('btn-cancel-task-modal');
    const modalBackdrop = document.getElementById('modal-add-task');
    const taskForm = document.getElementById('form-create-task');

    if (btnOpenModal) btnOpenModal.addEventListener('click', () => this.openModal());
    if (btnTopbarNewTask) btnTopbarNewTask.addEventListener('click', () => this.openModal());
    if (btnCloseModal) btnCloseModal.addEventListener('click', () => this.closeModal());
    if (btnCancelModal) btnCancelModal.addEventListener('click', () => this.closeModal());

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeModal();
      });
    }

    if (taskForm) {
      taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
    }

    // View Mode Switcher: Today's Tasks vs Task History
    const btnModeToday = document.getElementById('btn-view-mode-today');
    const btnModeHistory = document.getElementById('btn-view-mode-history');

    if (btnModeToday) {
      btnModeToday.addEventListener('click', () => this.switchTab('today'));
    }
    if (btnModeHistory) {
      btnModeHistory.addEventListener('click', () => this.switchTab('history'));
    }

    // Today filter pills
    const todayPills = document.querySelectorAll('#section-today-tasks .filter-pill');
    todayPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        todayPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.todayFilterStatus = pill.getAttribute('data-filter-status');
        this.render();
      });
    });

    const todayCatSelect = document.getElementById('task-filter-category');
    if (todayCatSelect) {
      todayCatSelect.addEventListener('change', (e) => {
        this.todayCategory = e.target.value;
        this.render();
      });
    }

    const todayPrioSelect = document.getElementById('task-filter-priority');
    if (todayPrioSelect) {
      todayPrioSelect.addEventListener('change', (e) => {
        this.todayPriority = e.target.value;
        this.render();
      });
    }

    // History filter pills
    const historyPills = document.querySelectorAll('#section-history-tasks .filter-pill');
    historyPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        historyPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.historyFilterStatus = pill.getAttribute('data-history-filter');
        this.render();
      });
    });

    const historyDateSelect = document.getElementById('history-filter-date');
    if (historyDateSelect) {
      historyDateSelect.addEventListener('change', (e) => {
        this.historyFilterDate = e.target.value;
        this.render();
      });
    }

    const historyCatSelect = document.getElementById('history-filter-category');
    if (historyCatSelect) {
      historyCatSelect.addEventListener('change', (e) => {
        this.historyCategory = e.target.value;
        this.render();
      });
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    const btnModeToday = document.getElementById('btn-view-mode-today');
    const btnModeHistory = document.getElementById('btn-view-mode-history');
    const secToday = document.getElementById('section-today-tasks');
    const secHistory = document.getElementById('section-history-tasks');

    if (tab === 'today') {
      if (btnModeToday) btnModeToday.classList.add('active');
      if (btnModeHistory) btnModeHistory.classList.remove('active');
      if (secToday) secToday.style.display = 'block';
      if (secHistory) secHistory.style.display = 'none';
    } else {
      if (btnModeToday) btnModeToday.classList.remove('active');
      if (btnModeHistory) btnModeHistory.classList.add('active');
      if (secToday) secToday.style.display = 'none';
      if (secHistory) secHistory.style.display = 'block';
    }

    this.render();
  },

  openModal() {
    const modal = document.getElementById('modal-add-task');
    const dateInput = document.getElementById('task-date-input');
    const todayStr = getTodayDateString(0);
    if (dateInput) {
      dateInput.value = todayStr;
      dateInput.setAttribute('readonly', 'true');
    }
    if (modal) modal.style.display = 'flex';
    const titleInput = document.getElementById('task-title-input');
    if (titleInput) titleInput.focus();
  },

  closeModal() {
    const modal = document.getElementById('modal-add-task');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('form-create-task');
    if (form) form.reset();
  },

  handleAddTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value.trim();
    const category = document.getElementById('task-category-input').value;
    const priority = document.getElementById('task-priority-input').value;
    const estimatedMinutes = parseInt(document.getElementById('task-time-input').value, 10) || 30;
    const todayStr = getTodayDateString(0);

    if (!title) {
      Toast.show('Please provide a task title', 'error');
      return;
    }

    const newTask = {
      id: generateId('task'),
      title,
      category,
      priority,
      estimatedMinutes,
      completed: false,
      date: todayStr,
      archived: false,
      createdAt: new Date().toISOString()
    };

    const tasks = StorageService.getTasks();
    tasks.unshift(newTask);
    StorageService.setTasks(tasks);

    Toast.show(`Task scheduled for today: "${title}"`, 'success');
    this.closeModal();

    // If currently on history tab, switch back to today's tasks
    if (this.currentTab !== 'today') {
      this.switchTab('today');
    } else {
      this.render();
    }
    DashboardController.render();
    ReviewController.render();
  },

  toggleComplete(taskId) {
    const tasks = StorageService.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    StorageService.setTasks(tasks);

    Toast.show(
      task.completed ? `Completed: "${task.title}"` : `Reopened: "${task.title}"`,
      task.completed ? 'success' : 'info'
    );

    this.render();
    DashboardController.render();
    ReviewController.render();
  },

  deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    let tasks = StorageService.getTasks();
    tasks = tasks.filter((t) => t.id !== taskId);
    StorageService.setTasks(tasks);

    Toast.show('Task deleted', 'info');
    this.render();
    DashboardController.render();
    ReviewController.render();
  },

  render() {
    // 1. Run automatic task archiving first
    TaskArchiveService.checkAndArchiveTasks();

    const allTasks = StorageService.getTasks();
    const todayStr = getTodayDateString(0);

    // 2. Separate active Today's tasks from Archived History
    const todayTasks = allTasks.filter((t) => t.date === todayStr && !t.archived);
    const historyTasks = allTasks.filter((t) => t.archived || (t.date && t.date < todayStr) || t.isUndated);

    // 3. Update Mode Switcher Count Badges
    const badgeToday = document.getElementById('count-tab-today');
    const badgeHistory = document.getElementById('count-tab-history');
    const dateLabel = document.getElementById('task-current-date-label');

    if (badgeToday) badgeToday.textContent = todayTasks.length;
    if (badgeHistory) badgeHistory.textContent = historyTasks.length;
    if (dateLabel) dateLabel.textContent = formatFriendlyDate();

    // 4. Render subsections
    this.renderToday(todayTasks);
    this.renderHistory(historyTasks);
  },

  renderToday(todayTasks) {
    const listContainer = document.getElementById('task-full-list');
    if (!listContainer) return;

    const countAll = todayTasks.length;
    const countPending = todayTasks.filter((t) => !t.completed).length;
    const countCompleted = todayTasks.filter((t) => t.completed).length;

    const elCountAll = document.getElementById('count-filter-all');
    const elCountPending = document.getElementById('count-filter-pending');
    const elCountCompleted = document.getElementById('count-filter-completed');
    const sidebarBadge = document.getElementById('sidebar-pending-badge');

    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountPending) elCountPending.textContent = countPending;
    if (elCountCompleted) elCountCompleted.textContent = countCompleted;
    if (sidebarBadge) sidebarBadge.textContent = countPending;

    // Apply Today Filters
    let filtered = todayTasks;
    if (this.todayFilterStatus === 'pending') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (this.todayFilterStatus === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }

    if (this.todayCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === this.todayCategory);
    }

    if (this.todayPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === this.todayPriority);
    }

    if (filtered.length === 0) {
      if (todayTasks.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state-card">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/>
            </svg>
            <h3>No tasks scheduled for today yet</h3>
            <p>Every new day starts with a fresh slate. Add your priority coursework and study targets for today.</p>
            <button class="btn btn-primary" style="margin-top: 14px;" onclick="TaskController.openModal()">
              <span>+ Add Today's First Task</span>
            </button>
          </div>
        `;
      } else {
        listContainer.innerHTML = `
          <div class="empty-state-card">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
            <h3>No tasks match your current filter</h3>
            <p>Try switching filter tabs or choosing a different category/priority above.</p>
          </div>
        `;
      }
      return;
    }

    listContainer.innerHTML = '';
    filtered.forEach((task) => {
      const card = document.createElement('div');
      card.className = `task-item-card ${task.completed ? 'completed' : ''}`;

      const priorityBadgeClass =
        task.priority === 'High' ? 'priority-high' : task.priority === 'Medium' ? 'priority-medium' : 'priority-low';

      card.innerHTML = `
        <div class="task-main-col">
          <label class="custom-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </label>
          <div class="task-details">
            <span class="task-title-text">${task.title}</span>
            <div class="task-meta-tags">
              <span class="meta-pill category">${task.category}</span>
              <span class="meta-pill ${priorityBadgeClass}">${task.priority}</span>
              <span class="meta-pill time-est">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${task.estimatedMinutes}m
              </span>
              <span class="meta-pill" style="color: var(--text-muted); font-size: 0.7rem;">Today (${formatShortDate(task.date)})</span>
            </div>
          </div>
        </div>
        <div class="task-actions-col">
          <button class="btn-icon-subtle btn-delete-task" title="Delete Task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;

      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => this.toggleComplete(task.id));

      const deleteBtn = card.querySelector('.btn-delete-task');
      deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

      listContainer.appendChild(card);
    });
  },

  renderHistory(historyTasks) {
    const historyContainer = document.getElementById('task-history-list');
    if (!historyContainer) return;

    // Filter counts
    const countAll = historyTasks.length;
    const countCompleted = historyTasks.filter((t) => t.completed).length;
    const countIncomplete = historyTasks.filter((t) => !t.completed).length;

    const elCountAll = document.getElementById('count-history-all');
    const elCountCompleted = document.getElementById('count-history-completed');
    const elCountIncomplete = document.getElementById('count-history-incomplete');

    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountCompleted) elCountCompleted.textContent = countCompleted;
    if (elCountIncomplete) elCountIncomplete.textContent = countIncomplete;

    // Populate History Date Select dropdown
    const dateSelect = document.getElementById('history-filter-date');
    if (dateSelect) {
      const uniqueDates = Array.from(
        new Set(historyTasks.filter((t) => t.date && !t.isUndated).map((t) => t.date))
      ).sort((a, b) => b.localeCompare(a)); // Descending order: newest date first

      const hasUndated = historyTasks.some((t) => t.isUndated || !t.date);

      const previousSelection = this.historyFilterDate;
      dateSelect.innerHTML = '<option value="all">All Past Dates</option>';

      uniqueDates.forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = formatFriendlyDateFromStr(d);
        if (d === previousSelection) opt.selected = true;
        dateSelect.appendChild(opt);
      });

      if (hasUndated) {
        const optUndated = document.createElement('option');
        optUndated.value = 'undated';
        optUndated.textContent = 'Legacy / Undated Tasks';
        if (previousSelection === 'undated') optUndated.selected = true;
        dateSelect.appendChild(optUndated);
      }
    }

    // Apply History Filters
    let filtered = historyTasks;
    if (this.historyFilterStatus === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    } else if (this.historyFilterStatus === 'incomplete') {
      filtered = filtered.filter((t) => !t.completed);
    }

    if (this.historyFilterDate !== 'all') {
      if (this.historyFilterDate === 'undated') {
        filtered = filtered.filter((t) => t.isUndated || !t.date);
      } else {
        filtered = filtered.filter((t) => t.date === this.historyFilterDate);
      }
    }

    if (this.historyCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === this.historyCategory);
    }

    if (filtered.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state-card">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/><path d="M3.05 11a9 9 0 1 1 .5 4"/>
          </svg>
          <h3>No archived tasks found</h3>
          <p>${historyTasks.length === 0 ? 'Tasks from previous days will automatically appear here once archived at midnight.' : 'No archived tasks match your selected filters.'}</p>
        </div>
      `;
      return;
    }

    // Group tasks by date in reverse chronological order
    const groups = {};
    filtered.forEach((task) => {
      const groupKey = (!task.date || task.isUndated) ? 'undated' : task.date;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
    });

    // Sort group keys in descending order (newest date first, undated at bottom)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'undated') return 1;
      if (b === 'undated') return -1;
      return b.localeCompare(a);
    });

    historyContainer.innerHTML = '';
    sortedKeys.forEach((key) => {
      const groupTasks = groups[key];
      const totalInGroup = groupTasks.length;
      const completedInGroup = groupTasks.filter((t) => t.completed).length;
      const pct = Math.round((completedInGroup / totalInGroup) * 100);

      const groupEl = document.createElement('div');
      groupEl.className = 'history-date-group';

      let displayTitle = '';
      if (key === 'undated') {
        displayTitle = 'Legacy / Undated Tasks';
      } else {
        displayTitle = formatFriendlyDateFromStr(key);
      }

      const allDone = completedInGroup === totalInGroup;

      groupEl.innerHTML = `
        <div class="history-group-header">
          <div class="history-group-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${displayTitle}</span>
          </div>
          <span class="history-group-badge ${allDone ? 'all-completed' : ''}">
            ${completedInGroup} of ${totalInGroup} completed (${pct}%)
          </span>
        </div>
        <div class="history-group-items"></div>
      `;

      const itemsContainer = groupEl.querySelector('.history-group-items');

      groupTasks.forEach((task) => {
        const card = document.createElement('div');
        card.className = `history-task-card ${task.completed ? 'completed' : 'incomplete'}`;

        const priorityBadgeClass =
          task.priority === 'High' ? 'priority-high' : task.priority === 'Medium' ? 'priority-medium' : 'priority-low';

        const statusBadge = task.completed
          ? '<span class="meta-pill status-completed">✓ Completed</span>'
          : '<span class="meta-pill status-incomplete">✗ Unfinished</span>';

        card.innerHTML = `
          <div class="task-main-col">
            <div class="task-details">
              <span class="task-title-text">${task.title}</span>
              <div class="task-meta-tags">
                ${statusBadge}
                <span class="meta-pill category">${task.category}</span>
                <span class="meta-pill ${priorityBadgeClass}">${task.priority}</span>
                <span class="meta-pill time-est">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${task.estimatedMinutes}m
                </span>
                ${task.archivedAt ? `<span class="meta-pill" style="color: var(--text-muted); font-size: 0.7rem;">Archived</span>` : ''}
              </div>
            </div>
          </div>
          <div class="task-actions-col">
            <button class="btn-icon-subtle btn-delete-task" title="Delete Historical Record">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        `;

        const deleteBtn = card.querySelector('.btn-delete-task');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        itemsContainer.appendChild(card);
      });

      historyContainer.appendChild(groupEl);
    });
  }
};

/* ==============================================================================
   STUDY TIMER CONTROLLER (Deep Work Stopwatch / Pomodoro)
   ============================================================================== */
const TimerController = {
  mode: 'stopwatch', // 'stopwatch' | 'pomodoro' | 'deep'
  status: 'ready', // 'ready' | 'running' | 'paused'
  secondsElapsed: 0,
  targetSeconds: 0, // For countdown modes
  timerInterval: null,
  activeSubject: 'Data Structures & Algorithms',

  init() {
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnResume = document.getElementById('btn-timer-resume');
    const btnFinish = document.getElementById('btn-timer-finish');
    const btnReset = document.getElementById('btn-timer-reset');

    const subjectInput = document.getElementById('timer-subject-input');
    const modePills = document.querySelectorAll('.timer-mode-pills .mode-pill');

    if (btnStart) btnStart.addEventListener('click', () => this.start());
    if (btnPause) btnPause.addEventListener('click', () => this.pause());
    if (btnResume) btnResume.addEventListener('click', () => this.resume());
    if (btnFinish) btnFinish.addEventListener('click', () => this.finish());
    if (btnReset) btnReset.addEventListener('click', () => this.reset());

    if (subjectInput) {
      subjectInput.addEventListener('input', (e) => {
        this.activeSubject = e.target.value.trim() || 'General Focus';
        document.getElementById('timer-subject-display').textContent = this.activeSubject;
      });
    }

    modePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        if (this.status === 'running') {
          if (!confirm('Switching modes will reset your current timer. Continue?')) return;
        }
        modePills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.setMode(pill.getAttribute('data-mode'));
      });
    });

    this.updateDisplay();
  },

  setMode(newMode) {
    this.mode = newMode;
    this.reset();

    if (newMode === 'pomodoro') {
      this.targetSeconds = 25 * 60;
    } else if (newMode === 'deep') {
      this.targetSeconds = 50 * 60;
    } else {
      this.targetSeconds = 0;
    }

    this.updateDisplay();
  },

  start() {
    const inputVal = document.getElementById('timer-subject-input').value.trim();
    this.activeSubject = inputVal || 'General Focus';
    document.getElementById('timer-subject-display').textContent = this.activeSubject;

    this.status = 'running';
    this.updateControlsUI();
    this.startInterval();

    const pulse = document.getElementById('sidebar-timer-pulse');
    if (pulse) pulse.style.display = 'block';

    Toast.show(`Focus session started: ${this.activeSubject}`, 'info');
  },

  pause() {
    this.status = 'paused';
    clearInterval(this.timerInterval);
    this.updateControlsUI();
    Toast.show('Timer paused', 'info');
  },

  resume() {
    this.status = 'running';
    this.updateControlsUI();
    this.startInterval();
  },

  startInterval() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      this.updateDisplay();

      // Check for countdown completion
      if (this.targetSeconds > 0 && this.secondsElapsed >= this.targetSeconds) {
        clearInterval(this.timerInterval);
        this.status = 'paused';
        Toast.show(`⏰ Time is up for ${this.activeSubject}!`, 'success');
        this.updateControlsUI();
      }
    }, 1000);
  },

  finish() {
    clearInterval(this.timerInterval);

    const elapsedMinutes = Math.round(this.secondsElapsed / 60);

    if (elapsedMinutes < 1 && this.secondsElapsed < 30) {
      if (!confirm('Session duration is less than a minute. Save anyway?')) {
        this.reset();
        return;
      }
    }

    // Minimum 1 min recorded if completed
    const finalMinutes = Math.max(1, elapsedMinutes);
    const today = getTodayDateString(0);

    const newSession = {
      id: generateId('sess'),
      subject: this.activeSubject,
      duration: finalMinutes,
      date: today
    };

    const sessions = StorageService.getSessions();
    sessions.unshift(newSession);
    StorageService.setSessions(sessions);

    Toast.show(`Saved study session: ${finalMinutes} min on "${this.activeSubject}"! 🎉`, 'success');

    this.reset();
    this.renderHistory();
    DashboardController.render();
  },

  reset() {
    clearInterval(this.timerInterval);
    this.status = 'ready';
    this.secondsElapsed = 0;
    this.updateControlsUI();
    this.updateDisplay();

    const pulse = document.getElementById('sidebar-timer-pulse');
    if (pulse) pulse.style.display = 'none';
  },

  updateControlsUI() {
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnResume = document.getElementById('btn-timer-resume');
    const btnFinish = document.getElementById('btn-timer-finish');
    const btnReset = document.getElementById('btn-timer-reset');
    const statusTag = document.getElementById('timer-status-tag');

    btnStart.style.display = 'none';
    btnPause.style.display = 'none';
    btnResume.style.display = 'none';
    btnFinish.style.display = 'none';
    btnReset.style.display = 'none';

    if (this.status === 'ready') {
      btnStart.style.display = 'inline-flex';
      statusTag.textContent = 'Ready';
      statusTag.style.color = 'var(--cyan)';
    } else if (this.status === 'running') {
      btnPause.style.display = 'inline-flex';
      btnFinish.style.display = 'inline-flex';
      btnReset.style.display = 'inline-flex';
      statusTag.textContent = 'Deep Focus Active ⚡';
      statusTag.style.color = 'var(--emerald)';
    } else if (this.status === 'paused') {
      btnResume.style.display = 'inline-flex';
      btnFinish.style.display = 'inline-flex';
      btnReset.style.display = 'inline-flex';
      statusTag.textContent = 'Paused ⏸';
      statusTag.style.color = 'var(--amber)';
    }
  },

  updateDisplay() {
    let displaySecs = this.secondsElapsed;

    // Countdown mode display
    if (this.targetSeconds > 0) {
      displaySecs = Math.max(0, this.targetSeconds - this.secondsElapsed);
    }

    const hrs = Math.floor(displaySecs / 3600);
    const mins = Math.floor((displaySecs % 3600) / 60);
    const secs = displaySecs % 60;

    const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const displayEl = document.getElementById('timer-digits-display');
    if (displayEl) displayEl.textContent = formatted;

    // SVG Circular Progress Ring
    const progressRing = document.getElementById('timer-progress-ring');
    if (progressRing) {
      const circumference = 2 * Math.PI * 130; // ~816.8
      let pct = 0;
      if (this.targetSeconds > 0) {
        pct = Math.min(1, this.secondsElapsed / this.targetSeconds);
      } else {
        // Stopwatch mode loops every hour (3600s)
        pct = (this.secondsElapsed % 3600) / 3600;
      }
      const offset = circumference - pct * circumference;
      progressRing.style.strokeDashoffset = offset;
    }
  },

  render() {
    this.renderHistory();
  },

  renderHistory() {
    const sessions = StorageService.getSessions();
    const container = document.getElementById('session-history-list');
    const countBadge = document.getElementById('history-total-sessions');

    if (countBadge) countBadge.textContent = `${sessions.length} Sessions`;
    if (!container) return;

    if (sessions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem;">
          No recorded study sessions yet. Start your first session above!
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    sessions.slice(0, 15).forEach((session) => {
      const row = document.createElement('div');
      row.className = 'session-item-row';
      row.innerHTML = `
        <div class="session-left">
          <span class="session-subj">${session.subject}</span>
          <span class="session-date">${formatShortDate(session.date)}</span>
        </div>
        <span class="session-dur">+${session.duration}m</span>
      `;
      container.appendChild(row);
    });
  }
};

/* ==============================================================================
   PROGRESS & ANALYTICS CONTROLLER
   ============================================================================== */
const ProgressController = {
  render() {
    const user = StorageService.getUser();
    const sessions = StorageService.getSessions();
    const tasks = StorageService.getTasks();
    const reviews = StorageService.getReviews();

    const targetHours = user?.dailyStudyTarget || 4.0;
    const chartTargetLabel = document.getElementById('chart-target-label');
    if (chartTargetLabel) chartTargetLabel.textContent = `${targetHours.toFixed(1)}h`;

    // 1. Total All-Time Study Hours
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    document.getElementById('stat-total-hours').textContent = `${totalHours}h`;

    // 2. Weekly Study Hours (Last 7 Days)
    const sevenDaysList = [];
    for (let i = 6; i >= 0; i--) {
      sevenDaysList.push(getTodayDateString(-i));
    }

    const weeklyMinutes = sessions
      .filter((s) => sevenDaysList.includes(s.date))
      .reduce((acc, s) => acc + (s.duration || 0), 0);
    document.getElementById('stat-weekly-hours').textContent = `${(weeklyMinutes / 60).toFixed(1)}h`;

    // 3. Monthly Study Hours (Current Month)
    const currentMonthStr = getTodayDateString(0).substring(0, 7); // 'YYYY-MM'
    const monthlyMinutes = sessions
      .filter((s) => s.date && s.date.startsWith(currentMonthStr))
      .reduce((acc, s) => acc + (s.duration || 0), 0);
    document.getElementById('stat-monthly-hours').textContent = `${(monthlyMinutes / 60).toFixed(1)}h`;

    // 4. Task Completion Rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('stat-task-completion-rate').textContent = `${taskRate}%`;

    // 5. Average Daily Rating
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + (parseInt(r.rating, 10) || 0), 0) / reviews.length).toFixed(1)
        : '0.0';
    document.getElementById('stat-avg-rating').textContent = `${avgRating} / 10`;

    // 6. Current Streak
    const streak = this.calculateStreak(sessions);
    document.getElementById('stat-streak-days').textContent = `${streak} Day${streak === 1 ? '' : 's'}`;

    // 7. Best Study Day
    const dayMap = {};
    sessions.forEach((s) => {
      dayMap[s.date] = (dayMap[s.date] || 0) + (s.duration || 0);
    });

    let bestDayDate = null;
    let bestDayMins = 0;
    Object.keys(dayMap).forEach((d) => {
      if (dayMap[d] > bestDayMins) {
        bestDayMins = dayMap[d];
        bestDayDate = d;
      }
    });

    const bestDayEl = document.getElementById('stat-best-day');
    const bestDayValEl = document.getElementById('stat-best-day-val');
    if (bestDayDate) {
      bestDayEl.textContent = formatShortDate(bestDayDate);
      bestDayValEl.textContent = `${(bestDayMins / 60).toFixed(1)}h peak focus`;
    } else {
      bestDayEl.textContent = '—';
      bestDayValEl.textContent = '0.0h peak focus';
    }

    // 8. Visual 7-Day Bar Chart
    this.renderWeeklyBarChart(sevenDaysList, dayMap, targetHours);

    // 9. Subject Focus Distribution Breakdown
    this.renderSubjectBreakdown(sessions, totalMinutes);
  },

  calculateStreak(sessions) {
    if (!sessions || sessions.length === 0) return 0;

    const studyDates = new Set(sessions.map((s) => s.date));
    let streak = 0;

    // Check today
    let checkDate = getTodayDateString(0);
    let offset = 0;

    // If no study today yet, see if yesterday had study to preserve active streak
    if (!studyDates.has(checkDate)) {
      checkDate = getTodayDateString(-1);
      offset = -1;
      if (!studyDates.has(checkDate)) {
        return 0;
      }
    }

    while (studyDates.has(getTodayDateString(offset))) {
      streak++;
      offset--;
    }

    return streak;
  },

  renderWeeklyBarChart(daysList, dayMap, targetHours) {
    const container = document.getElementById('bar-chart-weekly');
    if (!container) return;

    container.innerHTML = '';
    const maxValHours = Math.max(targetHours * 1.3, 6);

    daysList.forEach((dateStr) => {
      const minutes = dayMap[dateStr] || 0;
      const hours = minutes / 60;
      const pct = Math.min(100, Math.round((hours / maxValHours) * 100));
      const targetMet = hours >= targetHours;
      const dayName = formatDayOfWeek(dateStr);

      const col = document.createElement('div');
      col.className = 'chart-bar-column';
      col.innerHTML = `
        <div class="chart-tooltip">${formatShortDate(dateStr)}: ${hours.toFixed(1)}h</div>
        <div class="bar-track">
          <div class="bar-fill ${targetMet ? 'target-met' : ''}" style="height: ${Math.max(4, pct)}%;"></div>
        </div>
        <span class="bar-label-day">${dayName}</span>
        <span class="bar-label-val">${hours.toFixed(1)}h</span>
      `;
      container.appendChild(col);
    });
  },

  renderSubjectBreakdown(sessions, totalMinutes) {
    const container = document.getElementById('subject-breakdown-list');
    if (!container) return;

    if (sessions.length === 0 || totalMinutes === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">
          No subject data recorded yet.
        </div>
      `;
      return;
    }

    const subjMap = {};
    sessions.forEach((s) => {
      const key = s.subject || 'General Focus';
      subjMap[key] = (subjMap[key] || 0) + (s.duration || 0);
    });

    const sortedSubjects = Object.keys(subjMap)
      .map((k) => ({ name: k, minutes: subjMap[k] }))
      .sort((a, b) => b.minutes - a.minutes);

    const colors = [
      'linear-gradient(90deg, #38bdf8, #2563eb)',
      'linear-gradient(90deg, #10b981, #059669)',
      'linear-gradient(90deg, #f59e0b, #d97706)',
      'linear-gradient(90deg, #a855f7, #7c3aed)',
      'linear-gradient(90deg, #f43f5e, #e11d48)'
    ];

    container.innerHTML = '';
    sortedSubjects.slice(0, 5).forEach((item, idx) => {
      const pct = Math.round((item.minutes / totalMinutes) * 100);
      const hours = (item.minutes / 60).toFixed(1);
      const row = document.createElement('div');
      row.className = 'subj-row';
      row.innerHTML = `
        <div class="subj-header">
          <span class="subj-name">${item.name}</span>
          <span class="subj-hours">${hours}h (${pct}%)</span>
        </div>
        <div class="subj-bar-track">
          <div class="subj-bar-fill" style="width: ${pct}%; background: ${colors[idx % colors.length]};"></div>
        </div>
      `;
      container.appendChild(row);
    });
  }
};

/* ==============================================================================
   DAILY REVIEW CONTROLLER
   ============================================================================== */
const ReviewController = {
  selectedRating: 8,

  init() {
    const reviewForm = document.getElementById('daily-review-form');
    const rateBtns = document.querySelectorAll('.rating-pill-selector .rate-btn');

    rateBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        rateBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedRating = parseInt(btn.getAttribute('data-rating'), 10);
        document.getElementById('review-rating-value').value = this.selectedRating;
      });
    });

    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => this.handleSaveReview(e));
    }
  },

  handleSaveReview(e) {
    e.preventDefault();
    const todayStr = getTodayDateString(0);
    const rating = this.selectedRating;
    const reflection = document.getElementById('review-reflection').value.trim();
    const tomorrowPriority = document.getElementById('review-tomorrow-priority').value.trim();

    if (!reflection || !tomorrowPriority) {
      Toast.show('Please fill in both reflection and tomorrow’s priority', 'error');
      return;
    }

    const reviews = StorageService.getReviews();
    const existingIndex = reviews.findIndex((r) => r.date === todayStr);

    const reviewObj = {
      date: todayStr,
      rating,
      reflection,
      tomorrowPriority
    };

    if (existingIndex >= 0) {
      reviews[existingIndex] = reviewObj;
      Toast.show('Updated today’s review!', 'success');
    } else {
      reviews.unshift(reviewObj);
      Toast.show('Saved daily review!', 'success');
    }

    StorageService.setReviews(reviews);
    this.render();
    DashboardController.render();
  },

  render() {
    const todayStr = getTodayDateString(0);
    const friendlyDate = formatFriendlyDate();

    const dateHeader = document.getElementById('review-current-date-str');
    if (dateHeader) dateHeader.textContent = friendlyDate;

    // Auto Summary for today
    const tasks = StorageService.getTasks();
    const todayTasks = tasks.filter((t) => t.date === todayStr && !t.archived);
    const completedCount = todayTasks.filter((t) => t.completed).length;
    const pendingCount = todayTasks.filter((t) => !t.completed).length;

    const sessions = StorageService.getSessions();
    const todayMins = sessions.filter((s) => s.date === todayStr).reduce((acc, s) => acc + (s.duration || 0), 0);

    document.getElementById('review-summary-completed').textContent = completedCount;
    document.getElementById('review-summary-pending').textContent = pendingCount;
    document.getElementById('review-summary-study').textContent = formatMinutes(todayMins);

    // Populate existing review if already completed today
    const reviews = StorageService.getReviews();
    const todayReview = reviews.find((r) => r.date === todayStr);

    if (todayReview) {
      this.selectedRating = todayReview.rating;
      document.querySelectorAll('.rating-pill-selector .rate-btn').forEach((b) => {
        if (parseInt(b.getAttribute('data-rating'), 10) === todayReview.rating) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      document.getElementById('review-reflection').value = todayReview.reflection;
      document.getElementById('review-tomorrow-priority').value = todayReview.tomorrowPriority;
    }

    // Render Past Reviews List
    this.renderPastReviewsList(reviews);
  },

  renderPastReviewsList(reviews) {
    const container = document.getElementById('past-reviews-list');
    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.85rem;">
          No daily reviews saved yet. Complete your first review above!
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    reviews.forEach((r) => {
      const item = document.createElement('div');
      item.className = 'past-review-item';
      item.innerHTML = `
        <div class="past-review-header">
          <span class="past-review-date">${formatFriendlyDate(new Date(r.date.replace(/-/g, '/')))}</span>
          <span class="past-review-score">${r.rating} / 10 ⭐</span>
        </div>
        <p class="past-review-quote">"${r.reflection}"</p>
        <div class="past-review-tomorrow">
          <strong>Tomorrow's Focus:</strong> ${r.tomorrowPriority}
        </div>
      `;
      container.appendChild(item);
    });
  }
};

/* ==============================================================================
   SETTINGS CONTROLLER
   ============================================================================== */
const SettingsController = {
  init() {
    const profileForm = document.getElementById('settings-profile-form');
    const routineForm = document.getElementById('settings-routine-form');
    const targetSlider = document.getElementById('settings-target');
    const targetDisplay = document.getElementById('settings-target-display');
    const btnLoadDemo = document.getElementById('btn-settings-load-demo');
    const btnResetData = document.getElementById('btn-settings-reset-data');

    if (targetSlider && targetDisplay) {
      targetSlider.addEventListener('input', (e) => {
        targetDisplay.textContent = `${parseFloat(e.target.value).toFixed(1)} Hours`;
      });
    }

    if (profileForm) {
      profileForm.addEventListener('submit', (e) => this.handleSaveProfile(e));
    }

    if (routineForm) {
      routineForm.addEventListener('submit', (e) => this.handleSaveRoutine(e));
    }

    if (btnLoadDemo) {
      btnLoadDemo.addEventListener('click', () => {
        if (confirm('Load sample demo data? This will enrich your tasks, study sessions, and reviews.')) {
          StorageService.seedDemoData(true);
          Toast.show('Loaded comprehensive demo data!', 'success');
          App.bootstrap();
        }
      });
    }

    if (btnResetData) {
      btnResetData.addEventListener('click', async () => {
        if (confirm('DANGER: This will delete ALL local tasks, study history, and profile data. Continue?')) {
          const user = StorageService.getUser();
          if (user && user.uid && !user.isDemo) {
            await FirestoreService.clearAllUserData(user.uid);
          }
          StorageService.clearAllData();
          if (typeof auth !== 'undefined' && auth && auth.currentUser) {
            await auth.signOut();
          }
          Toast.show('All data cleared. Restarting...', 'info');
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      });
    }
  },

  handleSaveProfile(e) {
    e.preventDefault();
    const user = StorageService.getUser();
    if (!user) return;

    const newName = document.getElementById('settings-name').value.trim();
    const newTarget = parseFloat(document.getElementById('settings-target').value) || 4.0;

    if (!newName) {
      Toast.show('Name cannot be empty', 'error');
      return;
    }

    user.name = newName;
    user.dailyStudyTarget = newTarget;
    StorageService.setUser(user, true);

    Toast.show('Profile and study targets updated!', 'success');
    DashboardController.render();
  },

  handleSaveRoutine(e) {
    e.preventDefault();
    const user = StorageService.getUser();
    if (!user) return;

    user.routine = {
      wake: document.getElementById('settings-wake').value,
      workStart: document.getElementById('settings-work-start').value,
      workEnd: document.getElementById('settings-work-end').value,
      studyStart: document.getElementById('settings-study-start').value,
      studyEnd: document.getElementById('settings-study-end').value,
      sleep: document.getElementById('settings-sleep').value
    };

    StorageService.setUser(user, true);
    Toast.show('Routine timings updated successfully!', 'success');
    DashboardController.render();
  },

  render() {
    const user = StorageService.getUser();
    if (!user) return;

    document.getElementById('settings-name').value = user.name || '';
    document.getElementById('settings-email').value = user.email || '';
    const target = user.dailyStudyTarget || 4.0;
    document.getElementById('settings-target').value = target;
    document.getElementById('settings-target-display').textContent = `${target.toFixed(1)} Hours`;

    if (user.routine) {
      document.getElementById('settings-wake').value = user.routine.wake || '06:30';
      document.getElementById('settings-sleep').value = user.routine.sleep || '23:30';
      document.getElementById('settings-work-start').value = user.routine.workStart || '09:00';
      document.getElementById('settings-work-end').value = user.routine.workEnd || '16:00';
      document.getElementById('settings-study-start').value = user.routine.studyStart || '18:00';
      document.getElementById('settings-study-end').value = user.routine.studyEnd || '22:00';
    }
  }
};

/* ==============================================================================
   APPLICATION BOOTSTRAPPER
   ============================================================================== */
const App = {
  init() {
    TaskArchiveService.init();
    AuthSetupController.init();
    NavigationController.init();
    DashboardController.init();
    TaskController.init();
    TimerController.init();
    ReviewController.init();
    SettingsController.init();
  },

  bootstrap() {
    DashboardController.render();
    TaskController.render();
    TimerController.render();
    ProgressController.render();
    ReviewController.render();
    SettingsController.render();
  }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Active Firebase Session: load real-time user data from Firestore
          await FirestoreService.loadAllUserData(firebaseUser.uid);
          TaskArchiveService.checkAndArchiveTasks();
          AuthSetupController.checkCurrentState();
          App.bootstrap();
        } else {
          // No active Firebase User
          const localUser = StorageService.getUser();
          if (localUser && localUser.isDemo) {
            // Demo mode is active
            TaskArchiveService.checkAndArchiveTasks();
            AuthSetupController.checkCurrentState();
            App.bootstrap();
          } else {
            StorageService.clearActiveUser();
            AuthSetupController.resetUIState();
            AuthSetupController.checkCurrentState();
          }
        }
      } catch (err) {
        console.error('Error during onAuthStateChanged:', err);
      } finally {
        hideAppLoadingScreen();
      }
    });
  } else {
    TaskArchiveService.checkAndArchiveTasks();
    AuthSetupController.checkCurrentState();
    hideAppLoadingScreen();
  }
});

