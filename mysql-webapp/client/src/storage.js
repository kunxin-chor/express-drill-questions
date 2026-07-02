const PREFIX = 'expr-practice:code:';

export const storage = {
  loadCode(id) {
    try {
      const v = localStorage.getItem(PREFIX + id);
      return v == null ? null : v;
    } catch {
      return null;
    }
  },
  saveCode(id, code) {
    try {
      localStorage.setItem(PREFIX + id, code);
    } catch {
      // quota or disabled — fail silently
    }
  },
  clearCode(id) {
    try {
      localStorage.removeItem(PREFIX + id);
    } catch {
      // ignore
    }
  },
};
