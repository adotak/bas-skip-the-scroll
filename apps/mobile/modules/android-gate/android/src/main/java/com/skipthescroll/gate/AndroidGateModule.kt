package com.skipthescroll.gate

import android.app.ActivityManager
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AndroidGateModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("AndroidGate")

        Function("isSupported") {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1
        }

        Function("hasUsageStatsPermission") {
            val context = appContext.reactContext ?: return@Function false
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return@Function false
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    context.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    context.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        }

        Function("openUsageStatsSettings") {
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }

        Function("hasOverlayPermission") {
            val context = appContext.reactContext ?: return@Function false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(context)
            } else {
                true
            }
        }

        Function("openOverlaySettings") {
            val context = appContext.reactContext ?: return@Function
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            }
        }

        Function("isIgnoringBatteryOptimizations") {
            val context = appContext.reactContext ?: return@Function true
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
                pm?.isIgnoringBatteryOptimizations(context.packageName) ?: true
            } else {
                true
            }
        }

        Function("openBatteryOptimizationSettings") {
            val context = appContext.reactContext ?: return@Function
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    context.startActivity(intent)
                } catch (_: Exception) {
                    val fallback = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(fallback)
                }
            }
        }

        Function("startDetectorService") {
            val context = appContext.reactContext ?: return@Function false
            val store = AllowanceStore(context)
            store.isEnabled = true

            val serviceIntent = Intent(context, ForegroundAppDetectorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            true
        }

        Function("stopDetectorService") {
            val context = appContext.reactContext ?: return@Function false
            val store = AllowanceStore(context)
            store.isEnabled = false

            val serviceIntent = Intent(context, ForegroundAppDetectorService::class.java)
            context.stopService(serviceIntent)
            true
        }

        Function("isDetectorServiceRunning") {
            val context = appContext.reactContext ?: return@Function false
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return@Function false
            @Suppress("DEPRECATION")
            for (service in am.getRunningServices(Int.MAX_VALUE)) {
                if (ForegroundAppDetectorService::class.java.name == service.service.className) {
                    return@Function true
                }
            }
            false
        }

        Function("setTargetApps") { apps: List<String> ->
            val context = appContext.reactContext ?: return@Function
            val store = AllowanceStore(context)
            store.targetApps = apps.toSet()
        }

        Function("getTargetApps") {
            val context = appContext.reactContext ?: return@Function emptyList<String>()
            val store = AllowanceStore(context)
            store.targetApps.toList()
        }

        Function("setPauseDuration") { seconds: Int ->
            val context = appContext.reactContext ?: return@Function
            val store = AllowanceStore(context)
            store.basePauseDuration = seconds
        }

        Function("getPauseDuration") {
            val context = appContext.reactContext ?: return@Function 5
            val store = AllowanceStore(context)
            store.basePauseDuration
        }

        Function("getGateStats") {
            val context = appContext.reactContext ?: return@Function emptyMap<String, Any>()
            val store = AllowanceStore(context)
            store.getStats()
        }
    }
}
