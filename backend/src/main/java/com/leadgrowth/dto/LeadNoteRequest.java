package com.leadgrowth.dto;

import jakarta.validation.constraints.NotBlank;

public class LeadNoteRequest {
    @NotBlank(message = "Note content cannot be empty")
    private String note;

    public LeadNoteRequest() {}

    public LeadNoteRequest(String note) {
        this.note = note;
    }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
