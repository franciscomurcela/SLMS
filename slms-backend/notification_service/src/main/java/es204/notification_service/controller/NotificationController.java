package main.java.es204.notification_service.controller;

import es204.notification_service.dto.CreateNotificationRequest;
import es204.notification_service.dto.NotificationDTO;
import es204.notification_service.model.NotificationType;
import es204.notification_service.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * Create a new notification (internal use - called by other services)
     */
    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        log.info("Creating notification for user {} of type {}", request.getUserId(), request.getType());
        NotificationDTO notification = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }
    
    /**
     * Get all notifications for the authenticated user
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getUserNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID userId = extractUserId(authentication);
        log.info("Fetching notifications for user {}, page {}, size {}", userId, page, size);
        
        Page<NotificationDTO> notifications = notificationService.getUserNotifications(userId, page, size);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get unread notifications for the authenticated user
     */
    @GetMapping("/unread")
    public ResponseEntity<Page<NotificationDTO>> getUnreadNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        
        UUID userId = extractUserId(authentication);
        log.info("Fetching unread notifications for user {}", userId);
        
        Page<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId, page, size);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Get count of unread notifications
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        long count = notificationService.countUnreadNotifications(userId);
        log.info("User {} has {} unread notifications", userId, count);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Get notifications by type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<Page<NotificationDTO>> getNotificationsByType(
            Authentication authentication,
            @PathVariable NotificationType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID userId = extractUserId(authentication);
        log.info("Fetching notifications of type {} for user {}", type, userId);
        
        Page<NotificationDTO> notifications = notificationService.getNotificationsByType(userId, type, page, size);
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            Authentication authentication,
            @PathVariable Long id) {
        
        UUID userId = extractUserId(authentication);
        log.info("Marking notification {} as read for user {}", id, userId);
        
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Mark all notifications as read
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(Authentication authentication) {
        UUID userId = extractUserId(authentication);
        log.info("Marking all notifications as read for user {}", userId);
        
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("markedAsRead", count));
    }
    
    /**
     * Extract user ID from JWT token
     */
    private UUID extractUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalStateException("Invalid authentication");
        }
        
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userIdStr = jwt.getClaimAsString("user_id");
        
        if (userIdStr == null) {
            userIdStr = jwt.getSubject();
        }
        
        return UUID.fromString(userIdStr);
    }
}
