package com.leadgrowth.repository;

import com.leadgrowth.entity.UserProductivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProductivityRepository extends JpaRepository<UserProductivity, Long> {
    List<UserProductivity> findByWorkspaceIdAndDateAfter(Long workspaceId, LocalDate start);
    List<UserProductivity> findByWorkspaceIdAndUserIdAndDateAfter(Long workspaceId, Long userId, LocalDate start);
    Optional<UserProductivity> findByWorkspaceIdAndUserIdAndDate(Long workspaceId, Long userId, LocalDate date);

    @Modifying
    @Query("DELETE FROM UserProductivity up WHERE up.workspace.id = :workspaceId")
    void deleteByWorkspaceId(@Param("workspaceId") Long workspaceId);
}
