package com.skipthescroll.gate

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class ForegroundAppDetectorService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var allowanceStore: AllowanceStore
    private var lastForegroundPackage: String? = null
    private var isScreenOn = true

    companion object {
        const val CHANNEL_ID = "skipthescroll_detector_channel"
        const val NOTIFICATION_ID = 1001
        const val POLL_INTERVAL_MS = 1000L
    }

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    isScreenOn = false
                    handler.removeCallbacks(checkRunnable)
                }
                Intent.ACTION_SCREEN_ON -> {
                    isScreenOn = true
                    handler.post(checkRunnable)
                }
            }
        }
    }

    private val checkRunnable = object : Runnable {
        override fun run() {
            if (!isScreenOn || !allowanceStore.isEnabled) {
                return
            }

            val currentPkg = getForegroundPackage()
            if (currentPkg != null && currentPkg != packageName && currentPkg != lastForegroundPackage) {
                lastForegroundPackage = currentPkg

                if (allowanceStore.isTargetApp(currentPkg)) {
                    if (!allowanceStore.hasActiveAllowance(currentPkg)) {
                        triggerGate(currentPkg)
                    }
                }
            }

            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        allowanceStore = AllowanceStore(this)
        createNotificationChannel()

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Skip the Scroll Active")
            .setContentText("Guarding your intentional time")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(NOTIFICATION_ID, notification)

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
        }
        registerReceiver(screenReceiver, filter)
        handler.post(checkRunnable)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(checkRunnable)
        try {
            unregisterReceiver(screenReceiver)
        } catch (_: Exception) {}
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun getForegroundPackage(): String? {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
        val now = System.currentTimeMillis()
        val events = usm.queryEvents(now - 3000, now)
        val event = UsageEvents.Event()
        var latestPackage: String? = null

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                latestPackage = event.packageName
            }
        }

        return latestPackage
    }

    private fun triggerGate(packageName: String) {
        val intent = Intent(this, GateOverlayService::class.java).apply {
            putExtra(GateOverlayService.EXTRA_TARGET_PACKAGE, packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startService(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Intent Gate Protection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the pause gate running to prevent mindless feed opens."
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
