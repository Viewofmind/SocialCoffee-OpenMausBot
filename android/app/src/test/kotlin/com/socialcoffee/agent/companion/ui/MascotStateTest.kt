package com.socialcoffee.agent.companion.ui

import com.socialcoffee.agent.companion.core.Chat
import com.socialcoffee.agent.companion.core.CompanionState
import com.socialcoffee.agent.companion.core.Message
import com.socialcoffee.agent.companion.core.OptionCard
import com.socialcoffee.agent.companion.core.ToolActivity
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

/**
 * Which face a bot wears, in the desktop's order: a pinned expression, then a
 * failure, then work, then unread, then a question, then its role. The order is
 * the point — it is what makes "this one stopped and needs you" louder than "this
 * one is busy", so each rung is tested against the one below it.
 *
 * Ported alongside `ios/App/MascotState.swift`; a divergence here is a bot wearing
 * one face on the laptop and another on the phone.
 */
class MascotStateTest {
    private val idle = bot(title = "", name = "Bot")

    @Test
    fun `a pinned expression wins over everything the bot is doing`() {
        val pinned = idle.copy(
            mascotExpression = "celebrate",
            busy = true,
            unread = true,
        )
        assertEquals(MascotState.CELEBRATE, MascotState.forBot(pinned, failedActivity))
    }

    @Test
    fun `the desktop's legacy expression names still resolve`() {
        assertEquals(MascotState.IDLE, MascotState.normalize("deadpan"))
        assertEquals(MascotState.HAPPY, MascotState.normalize("friendly"))
        assertEquals(MascotState.WORKING, MascotState.normalize("focused"))
        assertEquals(MascotState.THINKING, MascotState.normalize("thinking"))
        assertEquals(MascotState.EXCITED, MascotState.normalize("excited"))
        assertEquals(MascotState.DROWSY, MascotState.normalize("sleepy"))
        assertEquals(MascotState.SURPRISED, MascotState.normalize("surprised"))
        assertEquals(MascotState.SUSPICIOUS, MascotState.normalize("skeptical"))
        assertEquals(MascotState.SCARED, MascotState.normalize("worried"))
        assertEquals(MascotState.PLAYFUL, MascotState.normalize("mischievous"))
    }

    @Test
    fun `every current expression name resolves to itself`() {
        for (state in MascotState.entries) {
            assertEquals(state, MascotState.normalize(state.id), state.id)
        }
    }

    @Test
    fun `an unknown or missing expression is not a pin`() {
        assertNull(MascotState.normalize(null))
        assertNull(MascotState.normalize(""))
        assertNull(MascotState.normalize("smouldering"))
        // and so the bot falls through to the rest of the ladder
        assertEquals(
            MascotState.WORKING,
            MascotState.forBot(idle.copy(mascotExpression = "smouldering", busy = true), null),
        )
    }

    @Test
    fun `a failed tool beats being busy`() {
        val busy = idle.copy(busy = true, unread = true)
        assertEquals(MascotState.ALERTING, MascotState.forBot(busy, failedActivity))
    }

    @Test
    fun `an activity that did not fail is not an alert`() {
        val ok = message(Message.Kind.ACTIVITY, tool = ToolActivity(name = "grep", ok = true))
        val unknown = message(Message.Kind.ACTIVITY, tool = ToolActivity(name = "grep"))
        assertEquals(MascotState.IDLE, MascotState.forBot(idle, ok))
        assertEquals(MascotState.IDLE, MascotState.forBot(idle, unknown))
    }

    @Test
    fun `a failure only counts on an activity`() {
        val text = message(Message.Kind.TEXT, tool = ToolActivity(name = "grep", ok = false))
        assertEquals(MascotState.IDLE, MascotState.forBot(idle, text))
    }

    @Test
    fun `busy beats unread`() {
        assertEquals(MascotState.WORKING, MascotState.forBot(idle.copy(busy = true, unread = true), null))
    }

    @Test
    fun `unread beats a question waiting on you`() {
        assertEquals(MascotState.NOTIFYING, MascotState.forBot(idle.copy(unread = true), optionsCard))
    }

    @Test
    fun `a question waiting on you beats the bot's role`() {
        val researcher = bot(title = "research", name = "Bot")
        assertEquals(MascotState.SEARCHING, MascotState.forBot(researcher, null))
        assertEquals(MascotState.CURIOUS, MascotState.forBot(researcher, optionsCard))
    }

    @Test
    fun `the role is read from name, title and description alike`() {
        assertEquals(MascotState.WORKING, MascotState.forBot(idle.copy(name = "Debug"), null))
        assertEquals(MascotState.WORKING, MascotState.forBot(idle.copy(title = "engineer"), null))
        assertEquals(MascotState.WORKING, MascotState.forBot(idle.copy(description = "writes software"), null))
    }

    @Test
    fun `each role wears the desktop's face for it`() {
        assertEquals(MascotState.WORKING, roleFace("engineering"))
        assertEquals(MascotState.SEARCHING, roleFace("investigate"))
        assertEquals(MascotState.EXCITED, roleFace("campaign"))
        assertEquals(MascotState.DROWSY, roleFace("overnight"))
        assertEquals(MascotState.RADAR, roleFace("uptime"))
        assertEquals(MascotState.SUSPICIOUS, roleFace("qa"))
        assertEquals(MascotState.SCARED, roleFace("compliance"))
        assertEquals(MascotState.PLAYFUL, roleFace("illustration"))
        assertEquals(MascotState.HAPPY, roleFace("onboarding"))
    }

    @Test
    fun `the first matching role wins, in the desktop's order`() {
        // "security" is checked before "design", and "code" before either
        assertEquals(MascotState.SCARED, roleFace("security design"))
        assertEquals(MascotState.WORKING, roleFace("code security design"))
    }

    @Test
    fun `a role matches whole words only`() {
        assertEquals(MascotState.IDLE, roleFace("codebase"))
        assertEquals(MascotState.IDLE, roleFace("aqua"))
        assertEquals(MascotState.SUSPICIOUS, roleFace("runs qa, mostly"))
        assertEquals(MascotState.DROWSY, roleFace("long-running errands"))
    }

    @Test
    fun `a bot with nothing to go on is idle`() {
        assertEquals(MascotState.IDLE, MascotState.forBot(idle, null))
    }

    @Test
    fun `a room always looks happy`() {
        val state = CompanionState(rooms = listOf(room()))
        assertEquals(MascotState.HAPPY, MascotState.forChat(Chat.RoomChat(room()), state))
    }

    @Test
    fun `a chat is resolved from its last visible message`() {
        val waiting = idle.copy(id = "bot-1")
        val state = CompanionState(
            bots = listOf(waiting),
            messages = mapOf(waiting.threadId to listOf(message(Message.Kind.TEXT), optionsCard)),
        )
        assertEquals(MascotState.CURIOUS, MascotState.forChat(Chat.BotChat(waiting), state))
    }

    @Test
    fun `a chat with no transcript still resolves`() {
        val state = CompanionState(bots = listOf(idle))
        assertEquals(MascotState.IDLE, MascotState.forChat(Chat.BotChat(idle), state))
    }

    private fun roleFace(description: String): MascotState =
        MascotState.forBot(idle.copy(description = description), null)

    private val failedActivity = message(
        Message.Kind.ACTIVITY,
        tool = ToolActivity(name = "shell", ok = false),
    )

    private val optionsCard = message(
        Message.Kind.OPTIONS,
        card = OptionCard(title = "Deploy?", subtitle = "", options = listOf("Yes"), requestId = "r1"),
    )

    private fun message(
        kind: Message.Kind,
        tool: ToolActivity? = null,
        card: OptionCard? = null,
    ) = Message(
        id = "m-${kind.name}-${tool?.ok}",
        role = Message.Role.BOT,
        kind = kind,
        at = 0.0,
        tool = tool,
        card = card,
    )
}
