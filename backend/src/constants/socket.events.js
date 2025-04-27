module.exports = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Location events
  UPDATE_LOCATION: "update_location",
  LOCATION_UPDATED: "location_updated",

  // Availability events
  UPDATE_AVAILABILITY: "update_availability",
  AVAILABILITY_UPDATED: "availability_updated",

  // Emergency events
  NEW_EMERGENCY: "new_emergency",
  EMERGENCY_CREATED: "emergency_created",
  EMERGENCY_STATUS_UPDATED: "emergency_status_updated",
  EMERGENCY_RESOLVED: "emergency_resolved",
  
  // SOS events
  SEND_SOS_ALERT: "send_sos_alert",
  SOS_ALERT_RECEIVED: "sos_alert_received",

  // Response events
  JOIN_EMERGENCY: "join_emergency",
  LEAVE_EMERGENCY: "leave_emergency",
  RESPONDER_ADDED: "responder_added",
  RESPONDER_UPDATED: "responder_updated",
  UPDATE_RESPONSE_STATUS: "update_response_status",
  RESPONDER_STATUS_UPDATED: "responder_status_updated",

  // Notification events
  NEW_NOTIFICATION: "new_notification",
  
  // Voice Assistant events
  VOICE_ASSISTANT_AUDIO: "voice_assistant_audio",
  VOICE_ASSISTANT_RESULT: "voice_assistant_result",
};
