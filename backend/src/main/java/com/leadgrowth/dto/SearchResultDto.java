package com.leadgrowth.dto;

public class SearchResultDto {
    private String title;
    private String type; // "LEAD", "CAMPAIGN", "TASK"
    private String subtitle;
    private String url;

    public SearchResultDto() {}

    public SearchResultDto(String title, String type, String subtitle, String url) {
        this.title = title;
        this.type = type;
        this.subtitle = subtitle;
        this.url = url;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
