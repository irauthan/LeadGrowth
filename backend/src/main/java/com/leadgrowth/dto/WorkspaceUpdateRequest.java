package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class WorkspaceUpdateRequest {

    @NotBlank(message = "Workspace name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String companyName;

    @Size(max = 50)
    private String industry;

    private Integer teamSize;

    @Size(max = 100)
    private String website;

    @Size(max = 50)
    private String timezone;

    @NotBlank(message = "Invite code is required")
    @Size(max = 50)
    private String inviteCode;

    @NotBlank(message = "URL slug is required")
    @Size(max = 100)
    private String slug;

    public WorkspaceUpdateRequest() {}

    public WorkspaceUpdateRequest(String name, String companyName, String industry, Integer teamSize, String website, String timezone, String inviteCode, String slug) {
        this.name = name;
        this.companyName = companyName;
        this.industry = industry;
        this.teamSize = teamSize;
        this.website = website;
        this.timezone = timezone;
        this.inviteCode = inviteCode;
        this.slug = slug;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public Integer getTeamSize() { return teamSize; }
    public void setTeamSize(Integer teamSize) { this.teamSize = teamSize; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
}
