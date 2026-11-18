package com.skipthescroll.gate

import android.content.Context
import android.content.SharedPreferences

class AllowanceStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("skipthescroll_gate_prefs", Context.MODE_PRIVATE)

    companion object {
        const val PREF_IS_ENABLED = "gate_is_enabled"
        const val PREF_PAUSE_DURATION = "gate_pause_duration"
        const val PREF_TARGET_APPS = "gate_target_apps"
        const val PREF_ALLOWANCE_EXPIRY_PREFIX = "allowance_expiry_"
        const val PREF_OPENS_PREFIX = "recent_opens_"
        const val PREF_REDIRECT_COUNT = "stats_redirect_count"
        const val PREF_CONTINUE_COUNT = "stats_continue_count"
        const val PREF_GATE_SHOWN_COUNT = "stats_gate_shown_count"
        const val PREF_REDIRECT_EVENTS = "stats_redirect_events"
        const val PREF_CONTINUE_EVENTS = "stats_continue_events"
        const val PREF_GATE_SHOWN_EVENTS = "stats_gate_shown_events"

        val DEFAULT_TARGET_APPS = setOf(
            "com.instagram.android",
            "com.zhiliaoapp.musically",      // TikTok
            "com.google.android.youtube",
            "com.facebook.katana",
            "com.snapchat.android",
            "com.twitter.android"            // X / Twitter
        )
    }

    var isEnabled: Boolean
        get() = prefs.getBoolean(PREF_IS_ENABLED, true)
        set(value) = prefs.edit().putBoolean(PREF_IS_ENABLED, value).apply()

    var basePauseDuration: Int
        get() = prefs.getInt(PREF_PAUSE_DURATION, 5)
        set(value) = prefs.edit().putInt(PREF_PAUSE_DURATION, value.coerceIn(3, 15)).apply()

    var targetApps: Set<String>
        get() = prefs.getStringSet(PREF_TARGET_APPS, DEFAULT_TARGET_APPS) ?: DEFAULT_TARGET_APPS
        set(value) = prefs.edit().putStringSet(PREF_TARGET_APPS, value).apply()

    fun isTargetApp(packageName: String): Boolean {
        return targetApps.contains(packageName)
    }

    fun hasActiveAllowance(packageName: String): Boolean {
        val expiry = prefs.getLong(PREF_ALLOWANCE_EXPIRY_PREFIX + packageName, 0L)
        return System.currentTimeMillis() < expiry
    }

    fun grantAllowance(packageName: String, minutes: Int = 5) {
        val expiry = System.currentTimeMillis() + (minutes * 60 * 1000L)
        prefs.edit().putLong(PREF_ALLOWANCE_EXPIRY_PREFIX + packageName, expiry).apply()
    }

    /**
     * Escalation logic:
     * Repeated opens within a rolling 60-minute window lengthen the pause:
     * 1st open: base (e.g. 5s)
     * 2nd open: 10s
     * 3rd+ open: 15s (hard cap)
     */
    fun recordOpenAndGetEscalatedPause(packageName: String): Int {
        val now = System.currentTimeMillis()
        val key = PREF_OPENS_PREFIX + packageName
        val raw = prefs.getString(key, "") ?: ""
        val cutoff = now - (60 * 60 * 1000L)

        // Filter timestamps from the last 60 minutes
        val timestamps = raw.split(",")
            .mapNotNull { it.toLongOrNull() }
            .filter { it > cutoff }
            .toMutableList()

        timestamps.add(now)
        prefs.edit().putString(key, timestamps.joinToString(",")).apply()

        // Increment gate shown counter
        val shown = prefs.getInt(PREF_GATE_SHOWN_COUNT, 0)
        prefs.edit().putInt(PREF_GATE_SHOWN_COUNT, shown + 1).apply()
        recordEvent(PREF_GATE_SHOWN_EVENTS)

        val recentCount = timestamps.size
        return when {
            recentCount <= 1 -> basePauseDuration
            recentCount == 2 -> (basePauseDuration + 5).coerceAtMost(15)
            else -> 15
        }
    }

    fun recordRedirect() {
        val current = prefs.getInt(PREF_REDIRECT_COUNT, 0)
        prefs.edit().putInt(PREF_REDIRECT_COUNT, current + 1).apply()
        recordEvent(PREF_REDIRECT_EVENTS)
    }

    fun recordContinueAnyway() {
        val current = prefs.getInt(PREF_CONTINUE_COUNT, 0)
        prefs.edit().putInt(PREF_CONTINUE_COUNT, current + 1).apply()
        recordEvent(PREF_CONTINUE_EVENTS)
    }

    fun getStats(): Map<String, Any> {
        return mapOf(
            "gateShown" to prefs.getInt(PREF_GATE_SHOWN_COUNT, 0),
            "redirects" to prefs.getInt(PREF_REDIRECT_COUNT, 0),
            "continueAnyway" to prefs.getInt(PREF_CONTINUE_COUNT, 0),
            "gateShownLast7Days" to countEvents(PREF_GATE_SHOWN_EVENTS, 7),
            "redirectsLast7Days" to countEvents(PREF_REDIRECT_EVENTS, 7),
            "continueAnywayLast7Days" to countEvents(PREF_CONTINUE_EVENTS, 7),
            "gateShownLast30Days" to countEvents(PREF_GATE_SHOWN_EVENTS, 30),
            "redirectsLast30Days" to countEvents(PREF_REDIRECT_EVENTS, 30),
            "continueAnywayLast30Days" to countEvents(PREF_CONTINUE_EVENTS, 30),
            "basePauseDuration" to basePauseDuration,
            "targetAppsCount" to targetApps.size,
            "isEnabled" to isEnabled
        )
    }

    private fun recordEvent(key: String) {
        val now = System.currentTimeMillis()
        val cutoff = now - (30L * 24L * 60L * 60L * 1000L)
        val timestamps = (prefs.getString(key, "") ?: "")
            .split(",")
            .mapNotNull { it.toLongOrNull() }
            .filter { it >= cutoff }
            .toMutableList()
        timestamps.add(now)
        prefs.edit().putString(key, timestamps.joinToString(",")).apply()
    }

    private fun countEvents(key: String, days: Int): Int {
        val cutoff = System.currentTimeMillis() - (days.toLong() * 24L * 60L * 60L * 1000L)
        val timestamps = (prefs.getString(key, "") ?: "").split(",")
        return timestamps.mapNotNull { it.toLongOrNull() }.count { it >= cutoff }
    }
}
