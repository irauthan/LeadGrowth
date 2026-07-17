package com.leadgrowth.service;

import com.leadgrowth.dto.PasswordChangeRequest;
import com.leadgrowth.dto.UserProfileRequest;
import com.leadgrowth.entity.User;
import com.leadgrowth.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User updateProfile(UserProfileRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setDesignation(request.getDesignation());
        user.setBio(request.getBio());
        
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public List<User> getWorkspaceMembers(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if (user.getWorkspace() == null) {
            throw new IllegalStateException("User does not belong to a workspace");
        }
        return userRepository.findByWorkspaceId(user.getWorkspace().getId());
    }
}
