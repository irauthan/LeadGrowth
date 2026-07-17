package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class UserProfileRequest {

    @NotBlank(message = "Full name cannot be blank")
    private String fullName;

    private String phone;
    private String designation;
    private String bio;
    private String profileImage;

    public UserProfileRequest() {}

    public UserProfileRequest(String fullName, String phone, String designation, String bio, String profileImage) {
        this.fullName = fullName;
        this.phone = phone;
        this.designation = designation;
        this.bio = bio;
        this.profileImage = profileImage;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
}
