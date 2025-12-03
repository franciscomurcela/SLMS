package main.java.es204.notification_service.repository;

import es204.notification_service.model.Notification;
import es204.notification_service.model.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find all notifications for a specific user
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    // Find unread notifications for a user
    Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    // Find notifications by type for a user
    Page<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, NotificationType type, Pageable pageable);
    
    // Count unread notifications for a user
    long countByUserIdAndIsReadFalse(UUID userId);
    
    // Find notifications older than specified date (for cleanup)
    List<Notification> findByCreatedAtBefore(LocalDateTime date);
    
    // Mark all notifications as read for a user
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);
    
    // Delete old notifications
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
}
