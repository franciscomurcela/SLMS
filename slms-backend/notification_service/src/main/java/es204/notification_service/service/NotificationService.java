package es204.notification_service.service;

import es204.notification_service.dto.CreateNotificationRequest;
import es204.notification_service.dto.NotificationDTO;
import es204.notification_service.model.Notification;
import es204.notification_service.model.NotificationType;
import es204.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private static final int RETENTION_DAYS = 30;
    
    /**
     * Create a new notification
     */
    @Transactional
    public NotificationDTO createNotification(CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .relatedEntityType(request.getRelatedEntityType())
                .relatedEntityId(request.getRelatedEntityId())
                .severity(request.getSeverity())
                .metadata(request.getMetadata())
                .build();
        
        Notification saved = notificationRepository.save(notification);
        log.info("Created notification {} for user {}", saved.getId(), saved.getUserId());
        
        return toDTO(saved);
    }
    
    /**
     * Get all notifications for a user with pagination
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotifications(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDTO);
    }
    
    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUnreadNotifications(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDTO);
    }
    
    /**
     * Get notifications by type
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotificationsByType(UUID userId, NotificationType type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable)
                .map(this::toDTO);
    }
    
    /**
     * Count unread notifications for a user
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    /**
     * Mark a notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, UUID userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getUserId().equals(userId) && !notification.getIsRead()) {
                notification.setIsRead(true);
                notification.setReadAt(LocalDateTime.now());
                notificationRepository.save(notification);
                log.info("Marked notification {} as read", notificationId);
            }
        });
    }
    
    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllAsRead(UUID userId) {
        int count = notificationRepository.markAllAsReadForUser(userId, LocalDateTime.now());
        log.info("Marked {} notifications as read for user {}", count, userId);
        return count;
    }
    
    /**
     * Delete old notifications (scheduled job - runs daily at 2 AM)
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deleted = notificationRepository.deleteOldNotifications(cutoffDate);
        log.info("Deleted {} notifications older than {} days", deleted, RETENTION_DAYS);
    }
    
    /**
     * Convert entity to DTO
     */
    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .severity(notification.getSeverity())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .metadata(notification.getMetadata())
                .build();
    }
}
