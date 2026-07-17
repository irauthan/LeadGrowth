package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateWorkspaceRequest {

    @NotBlank(message = "Workspace name is required")
    private String name;

    private String companyName;
    private String industry;
    private Integer teamSize;
    private String website;
    private String timezone;

    public CreateWorkspaceRequest() {}

    public CreateWorkspaceRequest(String name, String companyName, String industry, Integer teamSize, String website, String timezone) {
        this.name = name;
        this.companyName = companyName;
        this.industry = industry;
        this.teamSize = teamSize;
        this.website = website;
        this.timezone = timezone;
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
}
