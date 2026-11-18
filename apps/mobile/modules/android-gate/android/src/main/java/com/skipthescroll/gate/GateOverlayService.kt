package com.skipthescroll.gate

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class GateOverlayService : Service() {
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private lateinit var allowanceStore: AllowanceStore
    private var countDownTimer: CountDownTimer? = null

    companion object {
        const val EXTRA_TARGET_PACKAGE = "target_package"
    }

    override fun onCreate() {
        super.onCreate()
        allowanceStore = AllowanceStore(this)
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val targetPackage = intent?.getStringExtra(EXTRA_TARGET_PACKAGE) ?: "app"
        showOverlay(targetPackage)
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun showOverlay(targetPackage: String) {
        removeOverlay()

        val escalatedSeconds = allowanceStore.recordOpenAndGetEscalatedPause(targetPackage)
        val friendlyName = getAppName(targetPackage)

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
            PixelFormat.TRANSLUCENT
        )

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0A0A0A"))
            setPadding(dp(24), dp(48), dp(24), dp(48))
        }

        // Subtitle / Breathing countdown
        val counterText = TextView(this).apply {
            text = "$escalatedSeconds"
            setTextColor(Color.parseColor("#4ECDC4"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 48f)
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        root.addView(counterText)

        val breathingLabel = TextView(this).apply {
            text = "Take a breath..."
            setTextColor(Color.parseColor("#A0A0A0"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
            setPadding(0, dp(4), 0, dp(32))
        }
        root.addView(breathingLabel)

        // Main question
        val questionText = TextView(this).apply {
            text = "What did you open $friendlyName for?"
            setTextColor(Color.parseColor("#F5F5F5"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 24f)
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(32))
        }
        root.addView(questionText)

        // Actions container (disabled during breathing countdown)
        val actionsContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            visibility = View.INVISIBLE
        }

        // Option 1: Look something up
        val lookUpBtn = Button(this).apply {
            text = "🔍  Look something up"
            setBackgroundColor(Color.parseColor("#4ECDC4"))
            setTextColor(Color.parseColor("#0A0A0A"))
            setTypeface(null, Typeface.BOLD)
            setOnClickListener {
                allowanceStore.recordRedirect()
                val deepLink = Intent(Intent.ACTION_VIEW, Uri.parse("skipthescroll://intent?from=$friendlyName")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startActivity(deepLink)
                stopSelf()
            }
        }
        actionsContainer.addView(lookUpBtn, matchWidthMarginBottom(dp(12)))

        // Option 2: Just a quick break (5 min)
        val breakBtn = Button(this).apply {
            text = "⏱  Just a quick break (5 min)"
            setBackgroundColor(Color.parseColor("#1A1A1A"))
            setTextColor(Color.parseColor("#F5F5F5"))
            setOnClickListener {
                allowanceStore.grantAllowance(targetPackage, 5)
                stopSelf()
            }
        }
        actionsContainer.addView(breakBtn, matchWidthMarginBottom(dp(12)))

        // Option 3: Never mind (back to home)
        val neverMindBtn = Button(this).apply {
            text = "✕  Never mind"
            setBackgroundColor(Color.parseColor("#1A1A1A"))
            setTextColor(Color.parseColor("#A0A0A0"))
            setOnClickListener {
                val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(homeIntent)
                stopSelf()
            }
        }
        actionsContainer.addView(neverMindBtn, matchWidthMarginBottom(dp(16)))

        // Deliberate extra tap: Continue anyway
        val continueAnywayBtn = TextView(this).apply {
            text = "Continue to $friendlyName anyway →"
            setTextColor(Color.parseColor("#666666"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
            setPadding(0, dp(12), 0, dp(12))
            setOnClickListener {
                allowanceStore.recordContinueAnyway()
                allowanceStore.grantAllowance(targetPackage, 2) // Grace period
                stopSelf()
            }
        }
        actionsContainer.addView(continueAnywayBtn)

        root.addView(actionsContainer)

        try {
            windowManager?.addView(root, layoutParams)
            overlayView = root

            // Start countdown
            countDownTimer = object : CountDownTimer(escalatedSeconds * 1000L, 1000L) {
                override fun onTick(millisUntilFinished: Long) {
                    val secondsLeft = (millisUntilFinished / 1000L) + 1
                    counterText.text = "$secondsLeft"
                }

                override fun onFinish() {
                    counterText.text = "✦"
                    breathingLabel.text = "You are in control."
                    actionsContainer.visibility = View.VISIBLE
                }
            }.start()
        } catch (e: Exception) {
            e.printStackTrace()
            stopSelf()
        }
    }

    private fun removeOverlay() {
        countDownTimer?.cancel()
        countDownTimer = null
        if (overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (_: Exception) {}
            overlayView = null
        }
    }

    private fun getAppName(packageName: String): String {
        return when {
            packageName.contains("instagram") -> "Instagram"
            packageName.contains("musically") || packageName.contains("tiktok") -> "TikTok"
            packageName.contains("youtube") -> "YouTube"
            packageName.contains("facebook") -> "Facebook"
            packageName.contains("snapchat") -> "Snapchat"
            packageName.contains("twitter") -> "X"
            else -> packageName.substringAfterLast('.')
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    private fun matchWidthMarginBottom(bottomDp: Int): LinearLayout.LayoutParams {
        return LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = bottomDp
        }
    }
}
