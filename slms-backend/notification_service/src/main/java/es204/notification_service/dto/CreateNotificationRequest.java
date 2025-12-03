package main.java.es204.notification_service.dto;

import es204.notification_service.model.NotificationSeverity;
import es204.notification_service.model.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    
    @NotNull(message = "User ID is required")
    private UUID userId;
    
    @NotNull(message = "Notification type is required")
    private NotificationType type;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String relatedEntityType;
    
    private UUID relatedEntityId;
    
    @Builder.Default
    private NotificationSeverity severity = NotificationSeverity.INFO;
    
    private Map<String, Object> metadata;
}
