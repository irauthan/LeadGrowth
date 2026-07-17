package com.leadgrowth.dto;

import java.math.BigDecimal;

public class TrendDataPoint {
    private String date;
    private long clicks;
    private long impressions;
    private long conversions;
    private long leads;
    private BigDecimal spend;
    private BigDecimal revenue;

    public TrendDataPoint() {}

    public TrendDataPoint(String date, long clicks, long impressions, long conversions, long leads, BigDecimal spend, BigDecimal revenue) {
        this.date = date;
        this.clicks = clicks;
        this.impressions = impressions;
        this.conversions = conversions;
        this.leads = leads;
        this.spend = spend;
        this.revenue = revenue;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public long getClicks() { return clicks; }
    public void setClicks(long clicks) { this.clicks = clicks; }

    public long getImpressions() { return impressions; }
    public void setImpressions(long impressions) { this.impressions = impressions; }

    public long getConversions() { return conversions; }
    public void setConversions(long conversions) { this.conversions = conversions; }

    public long getLeads() { return leads; }
    public void setLeads(long leads) { this.leads = leads; }

    public BigDecimal getSpend() { return spend; }
    public void setSpend(BigDecimal spend) { this.spend = spend; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

    // Builder
    public static TrendDataPointBuilder builder() {
        return new TrendDataPointBuilder();
    }

    public static class TrendDataPointBuilder {
        private String date;
        private long clicks;
        private long impressions;
        private long conversions;
        private long leads;
        private BigDecimal spend;
        private BigDecimal revenue;

        TrendDataPointBuilder() {}

        public TrendDataPointBuilder date(String date) { this.date = date; return this; }
        public TrendDataPointBuilder clicks(long clicks) { this.clicks = clicks; return this; }
        public TrendDataPointBuilder impressions(long impressions) { this.impressions = impressions; return this; }
        public TrendDataPointBuilder conversions(long conversions) { this.conversions = conversions; return this; }
        public TrendDataPointBuilder leads(long leads) { this.leads = leads; return this; }
        public TrendDataPointBuilder spend(BigDecimal spend) { this.spend = spend; return this; }
        public TrendDataPointBuilder revenue(BigDecimal revenue) { this.revenue = revenue; return this; }

        public TrendDataPoint build() {
            return new TrendDataPoint(date, clicks, impressions, conversions, leads, spend, revenue);
        }
    }
}
