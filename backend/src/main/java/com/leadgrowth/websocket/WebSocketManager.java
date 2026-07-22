package com.leadgrowth.websocket;

import com.leadgrowth.dto.LeadDto;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketManager {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketManager(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastLead(Long workspaceId, LeadDto leadDto) {
        String destination = "/topic/workspace/" + workspaceId + "/leads";
        messagingTemplate.convertAndSend(destination, leadDto);
    }

    public void broadcastTask(Long workspaceId, Object taskDto) {
        String destination = "/topic/workspace/" + workspaceId + "/tasks";
        messagingTemplate.convertAndSend(destination, taskDto);
    }

    public void broadcastNotification(Long userId, Object notificationDto) {
        String destination = "/topic/user/" + userId + "/notifications";
        messagingTemplate.convertAndSend(destination, notificationDto);
    }

    public void broadcastWorkspaceNotification(Long workspaceId, Object notificationDto) {
        String destination = "/topic/workspace/" + workspaceId + "/notifications";
        messagingTemplate.convertAndSend(destination, notificationDto);
    }
}
