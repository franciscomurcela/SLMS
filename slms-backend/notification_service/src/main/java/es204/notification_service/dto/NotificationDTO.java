package es204.notification_service.dto;

import es204.notification_service.model.NotificationSeverity;
import es204.notification_service.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private UUID userId;
    private NotificationType type;
    private String title;
    private String message;
    private String relatedEntityType;
    private UUID relatedEntityId;
    private NotificationSeverity severity;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    private Map<String, Object> metadata;
}
