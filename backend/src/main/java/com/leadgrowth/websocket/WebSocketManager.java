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
}
