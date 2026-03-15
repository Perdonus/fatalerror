package com.neuralv.desktop.core.service

import com.google.gson.FieldNamingPolicy
import com.google.gson.GsonBuilder
import com.neuralv.desktop.core.model.SessionState
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

class SessionStore(
    private val stateFile: Path = defaultStatePath()
) {
    private val gson = GsonBuilder()
        .setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
        .setPrettyPrinting()
        .create()

    fun read(): SessionState? = runCatching {
        if (!Files.exists(stateFile)) return null
        gson.fromJson(Files.readString(stateFile), SessionState::class.java)
    }.getOrNull()

    fun write(state: SessionState) {
        Files.createDirectories(stateFile.parent)
        Files.writeString(stateFile, gson.toJson(state))
    }

    fun clear() {
        Files.deleteIfExists(stateFile)
    }

    companion object {
        fun defaultStatePath(): Path = Paths.get(
            System.getProperty("user.home"),
            ".config",
            "neuralv",
            "session.json"
        )
    }
}
