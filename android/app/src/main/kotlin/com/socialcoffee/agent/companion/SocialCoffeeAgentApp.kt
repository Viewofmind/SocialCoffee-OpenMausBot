package com.socialcoffee.agent.companion

import android.app.Application
import androidx.lifecycle.ProcessLifecycleOwner
import com.socialcoffee.agent.companion.audio.LiveCallManager
import com.socialcoffee.agent.companion.audio.VoicePreviewPlayer
import com.socialcoffee.agent.companion.audio.VoiceNotePlayer
import com.socialcoffee.agent.companion.avatar.AvatarImageStore
import com.socialcoffee.agent.companion.core.Session
import com.socialcoffee.agent.companion.discovery.NsdDiscovery
import com.socialcoffee.agent.companion.lifecycle.AlwaysOnConnectionService
import com.socialcoffee.agent.companion.lifecycle.AlwaysOnConnectionState
import com.socialcoffee.agent.companion.lifecycle.ServiceProcessAnchor
import com.socialcoffee.agent.companion.lifecycle.SessionLingerController
import com.socialcoffee.agent.companion.lifecycle.installSessionLinger
import com.socialcoffee.agent.companion.notifications.LocalNotificationPoster
import com.socialcoffee.agent.companion.permissions.CompanionPermissions
import com.socialcoffee.agent.companion.sharing.ShareInbox
import com.socialcoffee.agent.companion.storage.AlwaysOnPreferences
import com.socialcoffee.agent.companion.storage.DataStoreConnectionStore
import com.socialcoffee.agent.companion.storage.OnboardingPreferences
import com.socialcoffee.agent.companion.storage.KeystoreTokenStore
import com.socialcoffee.agent.companion.ui.FilePreviews
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

/**
 * Application entry: owns the long-lived [Session] and wires
 * [ProcessLifecycleOwner] the way iOS `scenePhase` drives connect and linger.
 */
class SocialCoffeeAgentApp : Application() {
    private val appJob = SupervisorJob()
    val appScope = CoroutineScope(appJob + Dispatchers.Main.immediate)

    lateinit var session: Session
        private set
    lateinit var notifications: LocalNotificationPoster
        private set
    lateinit var discovery: NsdDiscovery
        private set
    lateinit var permissions: CompanionPermissions
        private set

    /**
     * One instance for the whole process: [Session] writes the first-pair
     * education marker into it as part of committing a pairing, and the root
     * router reads it to decide whether that step is due.
     */
    lateinit var onboarding: OnboardingPreferences
        private set
    lateinit var avatars: AvatarImageStore
        private set
    lateinit var voicePreview: VoicePreviewPlayer
        private set
    lateinit var voiceNotes: VoiceNotePlayer
        private set
    lateinit var liveCalls: LiveCallManager
        private set
    lateinit var linger: SessionLingerController
        private set
    lateinit var shareInbox: ShareInbox
        private set
    lateinit var alwaysOn: AlwaysOnPreferences
        private set

    override fun onCreate() {
        super.onCreate()
        shareInbox = ShareInbox()
        ShareInbox.cleanStale(cacheDir)
        // Launch stays non-blocking. The preview store awaits the shared
        // completion barrier on its own IO coroutine before writing anything.
        FilePreviews.startStaleCleanup(this, appScope)
        notifications = LocalNotificationPoster(this)
        discovery = NsdDiscovery(this)
        permissions = CompanionPermissions(this)
        onboarding = OnboardingPreferences(this)
        session = Session(
            scope = appScope,
            connectionStore = DataStoreConnectionStore(this),
            tokenStore = KeystoreTokenStore(this),
            onboardingStore = onboarding,
            deviceNameProvider = {
                // User-visible device name; Settings.Global.DEVICE_NAME on API 25+.
                android.provider.Settings.Global.getString(contentResolver, "device_name")
                    ?.takeIf { it.isNotBlank() }
                    ?: android.os.Build.MODEL
            },
            notificationSink = notifications,
        )
        avatars = AvatarImageStore(fetch = session::avatarData)
        // Live calls hold media across screens, and end when the process
        // leaves the foreground — not when a rotation recreates the Activity —
        // so the manager is app-scoped and observes the process lifecycle, as
        // the linger controller below does.
        liveCalls = LiveCallManager(this, session, appScope)
        ProcessLifecycleOwner.get().lifecycle.addObserver(liveCalls)
        // A voice note or a voice preview asks for the audio focus, and the
        // call ends when it loses that focus: both players refuse while the
        // call holds the audio, whatever asks them to play.
        val liveCallHoldsAudio = { liveCalls.state.value.holdsMedia }
        voicePreview = VoicePreviewPlayer(this, liveCallHoldsAudio = liveCallHoldsAudio)
        voiceNotes = VoiceNotePlayer(this, liveCallHoldsAudio = liveCallHoldsAudio)

        // iOS resets the avatar cache inside signOut. Observe Unpaired here so
        // the platform cache cannot outlive the pairing that minted its URLs.
        appScope.launch {
            session.status
                .map { it is Session.Status.Unpaired }
                .distinctUntilChanged()
                .collect { unpaired ->
                    if (unpaired) avatars.clearBlocking()
                }
        }

        // Foreground reconnects; background lingers. Cutting the stream at
        // onStop would drop a turn that completes seconds after Home — the
        // notification is produced by this stream and nothing else.
        // `session.linger()` on iOS (`ios/App/CompanionApp.swift:26`).
        linger = installSessionLinger(
            lifecycle = ProcessLifecycleOwner.get().lifecycle,
            session = session,
            scope = appScope,
            anchor = ServiceProcessAnchor(this),
            alwaysOn = { AlwaysOnConnectionState.active },
        )

        alwaysOn = AlwaysOnPreferences(this)
        // Covers the case where the process was relaunched (not booted) while
        // the setting was on — e.g. the OS killed the whole app under memory
        // pressure and the user (or a notification tap) reopened it. A device
        // reboot is covered separately by AlwaysOnBootReceiver, which can run
        // before anything ever constructs this Application's Activity.
        if (alwaysOn.enabled.value) {
            AlwaysOnConnectionService.start(this)
        }
    }
}
