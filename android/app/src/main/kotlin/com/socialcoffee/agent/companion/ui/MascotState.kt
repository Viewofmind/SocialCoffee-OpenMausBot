package com.socialcoffee.agent.companion.ui

import com.socialcoffee.agent.companion.core.Bot
import com.socialcoffee.agent.companion.core.Chat
import com.socialcoffee.agent.companion.core.CompanionState
import com.socialcoffee.agent.companion.core.Message

/**
 * Which face a bot wears — the desktop's `stateForBot`, ported from
 * `ios/App/MascotState.swift`.
 *
 * A pinned expression wins; then what the bot is doing right now; then a guess
 * from its role. Same rules, same order, so a bot looks the same on the phone as
 * on the laptop.
 */

/** The desktop's legacy names, kept so an older bot record still resolves. */
private val legacy: Map<String, MascotState> = mapOf(
    "deadpan" to MascotState.IDLE,
    "friendly" to MascotState.HAPPY,
    "focused" to MascotState.WORKING,
    "thinking" to MascotState.THINKING,
    "excited" to MascotState.EXCITED,
    "sleepy" to MascotState.DROWSY,
    "surprised" to MascotState.SURPRISED,
    "skeptical" to MascotState.SUSPICIOUS,
    "worried" to MascotState.SCARED,
    "mischievous" to MascotState.PLAYFUL,
)

private val byId: Map<String, MascotState> = MascotState.entries.associateBy(MascotState::id)

/**
 * A face a bot's description argues for, and the words that argue for it. Whole
 * words only: a "codebase" bot is not a coder, and "qa" must not match "aqua".
 */
private class RoleFace(val state: MascotState, words: List<String>) {
    private val patterns = words.map { Regex("\\b${Regex.escape(it)}\\b") }

    fun matches(profile: String): Boolean = patterns.any { it.containsMatchIn(profile) }
}

/** In order: the first that matches wins, as on the desktop. */
private val roleFaces: List<RoleFace> = listOf(
    RoleFace(
        MascotState.WORKING,
        listOf("code", "coding", "developer", "development", "engineer", "engineering", "build", "debug", "program", "software"),
    ),
    RoleFace(
        MascotState.SEARCHING,
        listOf("research", "researcher", "search", "investigate", "strategy", "strategist", "study", "learn", "knowledge"),
    ),
    RoleFace(
        MascotState.EXCITED,
        listOf("marketing", "growth", "launch", "campaign", "social", "sales", "outreach", "brand"),
    ),
    RoleFace(
        MascotState.DROWSY,
        listOf("overnight", "night", "background", "async", "queue", "batch", "long-running"),
    ),
    RoleFace(
        MascotState.RADAR,
        listOf("monitor", "monitoring", "incident", "alert", "watch", "status", "uptime"),
    ),
    RoleFace(
        MascotState.SUSPICIOUS,
        listOf("review", "reviewer", "audit", "critic", "critique", "quality", "qa", "test", "legal"),
    ),
    RoleFace(
        MascotState.SCARED,
        listOf("security", "secure", "compliance", "risk", "privacy", "finance", "financial"),
    ),
    RoleFace(
        MascotState.PLAYFUL,
        listOf("design", "designer", "creative", "brainstorm", "art", "illustration", "music", "story"),
    ),
    RoleFace(
        MascotState.HAPPY,
        listOf("support", "help", "success", "onboarding", "coach", "teacher", "guide", "welcome"),
    ),
)

/** Resolves any stored value — current, legacy or junk — to a real state. */
internal fun MascotState.Companion.normalize(value: String?): MascotState? {
    if (value.isNullOrEmpty()) return null
    return byId[value] ?: legacy[value]
}

internal fun MascotState.Companion.forBot(bot: Bot, last: Message?): MascotState {
    normalize(bot.mascotExpression)?.let { return it }

    if (last?.kind == Message.Kind.ACTIVITY && last.tool?.ok == false) return MascotState.ALERTING
    if (bot.busy == true) return MascotState.WORKING
    if (bot.unread) return MascotState.NOTIFYING
    if (last?.kind == Message.Kind.OPTIONS) return MascotState.CURIOUS

    val profile = "${bot.name} ${bot.title} ${bot.description}".lowercase()
    for (role in roleFaces) {
        if (role.matches(profile)) return role.state
    }
    return MascotState.IDLE
}

/**
 * The face for a chat as a whole: a bot's own, a room's is "happy" — which is what
 * the desktop draws for room avatars.
 */
internal fun MascotState.Companion.forChat(chat: Chat, state: CompanionState): MascotState =
    forChat(chat, state.visibleTranscript(chat.threadId).lastOrNull())

/** The same, for a caller that already walked the chat's visible transcript. */
internal fun MascotState.Companion.forChat(chat: Chat, last: Message?): MascotState = when (chat) {
    is Chat.BotChat -> forBot(chat.bot, last)
    is Chat.RoomChat -> MascotState.HAPPY
}
