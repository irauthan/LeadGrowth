package com.leadgrowth.dto;

public class TeamActivityDto {
    private Long id;
    private String userEmail;
    private String userName;
    private String action;
    private String description;
    private String timestamp;

    public TeamActivityDto() {}

    public TeamActivityDto(Long id, String userEmail, String userName, String action, String description, String timestamp) {
        this.id = id;
        this.userEmail = userEmail;
        this.userName = userName;
        this.action = action;
        this.description = description;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    // Builder
    public static TeamActivityDtoBuilder builder() {
        return new TeamActivityDtoBuilder();
    }

    public static class TeamActivityDtoBuilder {
        private Long id;
        private String userEmail;
        private String userName;
        private String action;
        private String description;
        private String timestamp;

        TeamActivityDtoBuilder() {}

        public TeamActivityDtoBuilder id(Long id) { this.id = id; return this; }
        public TeamActivityDtoBuilder userEmail(String userEmail) { this.userEmail = userEmail; return this; }
        public TeamActivityDtoBuilder userName(String userName) { this.userName = userName; return this; }
        public TeamActivityDtoBuilder action(String action) { this.action = action; return this; }
        public TeamActivityDtoBuilder description(String description) { this.description = description; return this; }
        public TeamActivityDtoBuilder timestamp(String timestamp) { this.timestamp = timestamp; return this; }

        public TeamActivityDto build() {
            return new TeamActivityDto(id, userEmail, userName, action, description, timestamp);
        }
    }
}
