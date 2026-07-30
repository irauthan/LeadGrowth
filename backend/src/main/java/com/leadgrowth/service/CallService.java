package com.leadgrowth.service;

import com.leadgrowth.dto.CallAnalyticsDto;
import com.leadgrowth.dto.CallSessionDto;

import java.util.List;

public interface CallService {
    CallSessionDto startCall(Long leadId, String userEmail);
    CallSessionDto endCall(Long callId, String userEmail, String notes);
    CallSessionDto getActiveCall(String userEmail);
    List<CallSessionDto> getCallHistoryForLead(Long leadId);
    CallAnalyticsDto getUserCallAnalytics(String userEmail);
    CallAnalyticsDto getTeamCallAnalytics(String managerEmail);
    CallAnalyticsDto getAdminCallAnalytics(String adminEmail);
    List<CallSessionDto> getCallReports(String userEmail, Long userId, String startDate, String endDate);
}
