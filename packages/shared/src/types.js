"use strict";
// ─── Card ────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_BOXES = exports.MODES = exports.DEFAULT_CARDS = exports.MAX_CARDS = void 0;
// ─── Constants ───────────────────────────────────────────────────────────────
/** Hard cap — never exceed this. */
exports.MAX_CARDS = 10;
/** Default number of cards per session. */
exports.DEFAULT_CARDS = 7;
/** All available modes. */
exports.MODES = ['learn', 'fix', 'watch', 'read'];
/** All available time-box options in minutes. */
exports.TIME_BOXES = [5, 10, 20];
