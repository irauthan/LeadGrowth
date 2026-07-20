package com.leadgrowth.repository;

import com.leadgrowth.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, Long> {
    List<Integration> findByWorkspaceId(Long workspaceId);
    Optional<Integration> findByWorkspaceIdAndPlatformIgnoreCase(Long workspaceId, String platform);

    @Modifying
    @Query("DELETE FROM Integration i WHERE i.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
