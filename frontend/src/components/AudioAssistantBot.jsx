import { useState, useRef, useEffect } from "react"
import { StopCircle, Send, Mic, Loader } from "lucide-react"
import {
  sendVoiceAssistantAudio,
  initializeSocket,
  createMockSocket,
} from "../services/socketService"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

// Robot icon component based on the provided image
const RobotIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="256" cy="256" r="256" fill="#0066FF" />
    <path
      d="M256 140c-8 0-15-6-15-15v-20c0-8 7-15 15-15s15 7 15 15v20c0 9-7 15-15 15z"
      fill="white"
    />
    <path
      d="M320 260c0 35-29 65-64 65s-64-30-64-65c0-35 29-65 64-65s64 30 64 65z"
      fill="white"
    />
    <rect x="220" y="240" width="30" height="15" rx="7.5" fill="#0066FF" />
    <rect x="270" y="240" width="30" height="15" rx="7.5" fill="#0066FF" />
    <path
      d="M180 200c-11 0-20-9-20-20v-10c0-11 9-20 20-20h30c6 0 10 4 10 10v30c0 6-4 10-10 10h-30z"
      fill="white"
    />
    <path
      d="M310 200c11 0 20-9 20-20v-10c0-11-9-20-20-20h-30c-6 0-10 4-10 10v30c0 6-4 10-10 10h30z"
      fill="white"
    />
    <path
      d="M320 310c0 8-7 15-15 15h-100c-8 0-15-7-15-15v-20c0-8 7-15 15-15h100c8 0 15 7 15 15v20z"
      fill="white"
    />
    <path
      d="M320 310v15c0 8-7 15-15 15h-100c-8 0-15-7-15-15v-15l65-25 65 25z"
      fill="white"
    />
  </svg>
)

const AudioAssistantBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState(null)
  const [socketError, setSocketError] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const animationRef = useRef(null)
  const canvasRef = useRef(null)
  const socketRef = useRef(null)

  const navigate = useNavigate()
  const { currentLocation } = useSelector((state) => state.user)
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Ensure socket is available
  useEffect(() => {
    console.log(
      "[VOICE ASSISTANT] Initializing with auth status:",
      isAuthenticated
    )

    if (isAuthenticated && !window.socket) {
      // Try to initialize socket if not available
      console.log("[VOICE ASSISTANT] No global socket found, initializing...")
      const socket = initializeSocket()

      if (socket) {
        console.log("[VOICE ASSISTANT] Socket initialized successfully")
        window.socket = socket
        socketRef.current = socket
      } else {
        console.warn(
          "[VOICE ASSISTANT] Failed to initialize real socket, creating mock socket for testing"
        )
        const mockSocket = createMockSocket()
        window.socket = mockSocket
        socketRef.current = mockSocket
      }
    } else {
      console.log("[VOICE ASSISTANT] Using existing socket")
      socketRef.current = window.socket

      // If no socket is available, create a mock socket
      if (!socketRef.current) {
        console.warn(
          "[VOICE ASSISTANT] No socket available, creating mock socket"
        )
        const mockSocket = createMockSocket()
        window.socket = mockSocket
        socketRef.current = mockSocket
      }
    }

    return () => {
      // Clean up socket listeners if we added any
      if (socketRef.current) {
        console.log("[VOICE ASSISTANT] Cleaning up socket listeners")
        socketRef.current.off("voice_assistant_result")
      }
    }
  }, [isAuthenticated])

  // Handle opening/closing the assistant panel
  const toggleAssistant = () => {
    setIsOpen(!isOpen)
    if (isRecording) {
      stopRecording()
    }
  }

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        })

        // Set processing state
        setIsProcessing(true)
        setProcessingResult(null)

        // Get current location
        const location = {
          longitude: currentLocation ? currentLocation[0] : -122.4194,
          latitude: currentLocation ? currentLocation[1] : 37.7749,
          address: "Current location", // In a real app, you would get the actual address
        }

        try {
          console.log("[VOICE ASSISTANT] Processing recorded audio...")

          // Check if socket is available
          if (!socketRef.current) {
            console.warn(
              "[VOICE ASSISTANT] No socket reference, creating mock socket"
            )
            const mockSocket = createMockSocket()
            window.socket = mockSocket
            socketRef.current = mockSocket
          }

          if (!socketRef.current.connected) {
            console.warn(
              "[VOICE ASSISTANT] Socket not connected, attempting to reconnect"
            )

            // Try to reconnect
            const socket = initializeSocket()
            if (socket) {
              console.log("[VOICE ASSISTANT] Reconnected successfully")
              window.socket = socket
              socketRef.current = socket

              // Wait a moment for connection to establish
              setTimeout(() => {
                if (socketRef.current.connected) {
                  console.log(
                    "[VOICE ASSISTANT] Connection confirmed, sending audio"
                  )
                  // Send audio to backend via socket
                  sendVoiceAssistantAudio(audioBlob, location)
                  setupResultListener(socketRef.current)
                } else {
                  console.error(
                    "[VOICE ASSISTANT] Still not connected after reconnect attempt"
                  )
                  // Fall back to mock socket
                  const mockSocket = createMockSocket()
                  window.socket = mockSocket
                  socketRef.current = mockSocket

                  // Send audio to mock socket
                  console.log("[VOICE ASSISTANT] Using mock socket instead")
                  sendVoiceAssistantAudio(audioBlob, location)
                  setupResultListener(mockSocket)
                }
              }, 1000)
            } else {
              console.error(
                "[VOICE ASSISTANT] Reconnection failed, using mock socket"
              )
              const mockSocket = createMockSocket()
              window.socket = mockSocket
              socketRef.current = mockSocket

              // Send audio to mock socket
              sendVoiceAssistantAudio(audioBlob, location)
              setupResultListener(mockSocket)
            }
          } else {
            // Socket is available and connected
            console.log("[VOICE ASSISTANT] Socket connected, sending audio")
            sendVoiceAssistantAudio(audioBlob, location)
            setupResultListener(socketRef.current)
          }
        } catch (error) {
          console.error("[VOICE ASSISTANT] Socket error:", error)
          handleSocketError()
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      startWaveAnimation()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert(
        "Could not access your microphone. Please check permissions and try again."
      )
    }
  }

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      stopWaveAnimation()

      // Stop all tracks on the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop())
    }
  }

  // Handle socket error
  const handleSocketError = () => {
    console.error("[VOICE ASSISTANT] Socket error occurred")
    setIsProcessing(false)
    setSocketError(true)
    setTranscript("Could not connect to server. Please try again later.")

    // Try to create a mock socket as fallback
    try {
      console.log("[VOICE ASSISTANT] Creating mock socket as fallback")
      const mockSocket = createMockSocket()
      window.socket = mockSocket
      socketRef.current = mockSocket
    } catch (error) {
      console.error("[VOICE ASSISTANT] Failed to create mock socket:", error)
    }
  }

  // Setup result listener
  const setupResultListener = (socket) => {
    console.log("[VOICE ASSISTANT] Setting up result listener")

    const resultHandler = (result) => {
      console.log("[VOICE ASSISTANT] Received result:", result)
      setIsProcessing(false)
      setProcessingResult(result)

      if (result.success) {
        setTranscript(result.text)

        // Navigate to emergency details after a delay (only if panel is still open)
        const navigationTimeoutId = setTimeout(() => {
          // Only navigate automatically if the panel is still open
          if (isOpen) {
            console.log(
              "[VOICE ASSISTANT] Auto-navigating to emergency details:",
              result.emergencyId
            )
            // Check if using a mock ID, go to dashboard instead of a specific emergency
            if (result.emergencyId && result.emergencyId.startsWith("mock-")) {
              // For mock responses, go to dashboard instead
              navigate("/dashboard")
              // Show a toast or notification that this was a test
            } else {
              // Navigate to the actual emergency
              navigate(`/emergency/${result.emergencyId}`)
            }
          }
        }, 2000)

        // Store the timeout ID for cleanup
        result.navigationTimeoutId = navigationTimeoutId
      } else {
        setTranscript(
          result.text || "Failed to process audio. Please try again."
        )
      }

      // Remove listener after receiving result
      socket.off("voice_assistant_result", resultHandler)
    }

    // Set timeout for response
    const timeoutId = setTimeout(() => {
      console.warn("[VOICE ASSISTANT] Response timeout reached")
      socket.off("voice_assistant_result", resultHandler)

      // Try with mock socket as fallback
      if (socket !== window.mockSocket) {
        console.log("[VOICE ASSISTANT] Trying with mock socket as fallback")
        const mockSocket = createMockSocket()
        window.mockSocket = mockSocket

        // Setup mock listener
        mockSocket.on("voice_assistant_result", (mockResult) => {
          console.log("[VOICE ASSISTANT] Received mock result:", mockResult)
          setIsProcessing(false)
          setProcessingResult(mockResult)
          setTranscript(mockResult.text)

          // Navigate to emergency details after a delay
          setTimeout(() => {
            // Add the check for mock IDs here
            if (
              mockResult.emergencyId &&
              mockResult.emergencyId.startsWith("mock-")
            ) {
              console.log(
                "[VOICE ASSISTANT] Mock ID detected, navigating to dashboard"
              )
              navigate("/dashboard")
            } else {
              navigate(`/emergency/${mockResult.emergencyId}`)
            }
          }, 2000)
        })

        // Trigger mock response
        setTimeout(() => {
          mockSocket._callbacks["voice_assistant_result"]({
            success: true,
            text: "This is a mock response for testing. Fire emergency detected at your location.",
            emergencyId: "mock-emergency-123",
            message: "Fire emergency detected",
          })
        }, 1000)
      } else {
        handleSocketError()
      }
    }, 10000) // 10 second timeout

    // Add listener
    socket.on("voice_assistant_result", (result) => {
      console.log("[VOICE ASSISTANT] Result received, clearing timeout")
      clearTimeout(timeoutId)
      resultHandler(result)
    })
  }

  // Reset the assistant
  const resetAssistant = () => {
    // If there's a valid processing result and the user clicked "View Emergency"
    if (processingResult && processingResult.success) {
      // Clear the automatic timeout navigation by navigating immediately
      console.log(
        "[VOICE ASSISTANT] Manual navigation triggered for emergency:",
        processingResult.emergencyId
      )

      // Check if using a mock ID
      if (
        processingResult.emergencyId &&
        processingResult.emergencyId.startsWith("mock-")
      ) {
        // For mock responses, go to dashboard instead
        navigate("/dashboard")
        // Could add a toast notification here that this was a test
      } else {
        // Navigate to the actual emergency
        navigate(`/emergency/${processingResult.emergencyId}`)
      }
    } else {
      // Just close the panel without navigation
      setTranscript("")
      setProcessingResult(null)
      setSocketError(false)
      setIsOpen(false)
    }
  }

  // Wave animation for recording visualization
  const startWaveAnimation = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    const drawWave = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw multiple waves with different colors for a more professional look
      drawSingleWave(ctx, width, height, "#4f46e5", 1.5, 15, 0) // Indigo wave
      drawSingleWave(ctx, width, height, "#2563eb", 2, 12, 0.3) // Blue wave
      drawSingleWave(ctx, width, height, "#3b82f6", 2.5, 8, 0.6) // Light blue wave

      animationRef.current = requestAnimationFrame(drawWave)
    }

    // Function to draw a single wave
    function drawSingleWave(
      ctx,
      width,
      height,
      color,
      lineWidth,
      maxAmplitude,
      offset
    ) {
      ctx.beginPath()

      const centerY = height / 2
      // Use time-based animation for smooth wave effect
      const time = Date.now() / 1000
      const frequency = 0.15

      ctx.moveTo(0, centerY)

      for (let x = 0; x < width; x += 2) {
        // Create more natural wave with multiple sine functions
        const amplitude = ((Math.sin(time * 2 + offset) + 1) * maxAmplitude) / 2
        const y =
          centerY + Math.sin(x * frequency + time * 3 + offset) * amplitude
        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.stroke()
    }

    drawWave()
  }

  const stopWaveAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null

      // Clear the canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (processingResult && processingResult.navigationTimeoutId) {
        clearTimeout(processingResult.navigationTimeoutId)
      }
    }
  }, [isRecording, processingResult])

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main bot button */}
      <button
        onClick={toggleAssistant}
        className={`flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? "bg-destructive text-white rotate-90" : "text-white"
        }`}
        style={{
          boxShadow: isOpen
            ? "0 4px 12px rgba(220, 38, 38, 0.5)"
            : "0 4px 12px rgba(37, 99, 235, 0.5)",
          padding: 0,
          overflow: "hidden",
          border: "none",
        }}
      >
        {isOpen ? (
          <span className="text-2xl font-bold">×</span>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <RobotIcon size={80} />
          </div>
        )}
      </button>

      {/* Assistant panel */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-80 bg-white rounded-lg shadow-2xl border border-blue-100 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-200">
            <div className="flex items-center">
              <RobotIcon size={28} className="mr-2" />
              <h3 className="font-medium text-white text-base">
                Voice Assistant
              </h3>
            </div>
            <p className="text-xs text-blue-100">
              Describe your emergency situation
            </p>
          </div>

          <div className="p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader size={32} className="animate-spin text-blue-600 mb-2" />
                <p className="text-sm text-blue-600 font-medium">
                  Processing your emergency report...
                </p>
              </div>
            ) : transcript ? (
              <div className="mb-4">
                <p className="text-sm mb-2 font-medium">Transcription:</p>
                <div className="bg-muted p-2 rounded-md text-sm">
                  {transcript}
                </div>
                {processingResult && processingResult.success && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md">
                    <p className="text-sm text-green-600">
                      <span className="font-medium">Emergency detected:</span>{" "}
                      {processingResult.message}
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      Redirecting to emergency details...
                    </p>
                  </div>
                )}
                {processingResult && !processingResult.success && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
                    <p className="text-sm text-red-600">
                      {processingResult.message}
                    </p>
                  </div>
                )}

                {socketError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
                    <p className="text-sm text-red-600">
                      <span className="font-medium">Connection Error:</span>{" "}
                      Could not connect to server
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Please check your connection and try again
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">
                {isRecording
                  ? "Listening..."
                  : "Press the microphone to start recording"}
              </div>
            )}

            {isRecording && (
              <div className="my-3 bg-blue-50 rounded-md p-3 border border-blue-100">
                <canvas
                  ref={canvasRef}
                  width="280"
                  height="60"
                  className="w-full"
                />
              </div>
            )}

            <div className="flex justify-center mt-2 space-x-3">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-red-600 text-white shadow-lg"
                  style={{ boxShadow: "0 4px 12px rgba(220, 38, 38, 0.5)" }}
                >
                  <StopCircle size={28} />
                </button>
              ) : transcript ? (
                <button
                  onClick={resetAssistant}
                  className="flex items-center justify-center px-6 py-3 rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium shadow-lg"
                  style={{ boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)" }}
                >
                  {processingResult && processingResult.success ? (
                    <span>View Emergency</span>
                  ) : (
                    <span>Close</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg"
                  style={{ boxShadow: "0 4px 12px rgba(37, 99, 235, 0.5)" }}
                >
                  <Mic size={32} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioAssistantBot
