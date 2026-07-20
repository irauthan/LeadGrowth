package com.leadgrowth.repository;

import com.leadgrowth.entity.User;
import com.leadgrowth.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserAndIsExpiredFalse(User user);
    List<UserSession> findByUser(User user);
    Optional<UserSession> findByIdAndUser(Long id, User user);
}
