package com.leadgrowth.repository;

import com.leadgrowth.entity.SyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SyncLogRepository extends JpaRepository<SyncLog, Long> {
    List<SyncLog> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    @Modifying
    @Query("DELETE FROM SyncLog sl WHERE sl.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
