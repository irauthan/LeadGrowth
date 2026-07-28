package com.leadgrowth.dto;

public class CompleteStepRequest {
    private String completionRemarks;

    public CompleteStepRequest() {}

    public CompleteStepRequest(String completionRemarks) {
        this.completionRemarks = completionRemarks;
    }

    public String getCompletionRemarks() { return completionRemarks; }
    public void setCompletionRemarks(String completionRemarks) { this.completionRemarks = completionRemarks; }
}
