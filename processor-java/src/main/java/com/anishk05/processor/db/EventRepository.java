package com.anishk05.processor.db;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, UUID> {
    
    Optional<EventEntity> findByTenantIdAndEventId(String tenantId, String eventId);
    
    Optional<EventEntity> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);
    
    @Query("SELECT e FROM EventEntity e WHERE e.processedAt > :since ORDER BY e.processedAt DESC")
    List<EventEntity> findRecentEvents(@Param("since") LocalDateTime since);
    
    @Query("SELECT e FROM EventEntity e ORDER BY e.receivedAt DESC")
    List<EventEntity> findRecentEventsByReceivedAt(Pageable pageable);
    
    @Query("SELECT e.eventType as eventType, COUNT(e) as count " +
           "FROM EventEntity e " +
           "WHERE e.processedAt > :since " +
           "GROUP BY e.eventType " +
           "ORDER BY COUNT(e) DESC")
    List<Object[]> countEventTypesSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(e) FROM EventEntity e WHERE e.processedAt > :since")
    long countEventsSince(@Param("since") LocalDateTime since);
}


