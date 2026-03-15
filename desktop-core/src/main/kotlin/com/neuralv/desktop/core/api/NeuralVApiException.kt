package com.neuralv.desktop.core.api

class NeuralVApiException(
    val statusCode: Int,
    override val message: String
) : RuntimeException(message)
