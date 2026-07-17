package com.leadgrowth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use /topic as simple broker destination for client subscriptions
        config.enableSimpleBroker("/topic");
        // Use /app as application prefix for incoming messages from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register connection endpoint for client handshakes
        registry.addEndpoint("/ws-leads")
                .setAllowedOriginPatterns("*")
                .withSockJS();
                
        registry.addEndpoint("/ws-leads")
                .setAllowedOriginPatterns("*"); // Fallback for raw websockets (no SockJS)
    }
}
