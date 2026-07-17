package com.leadgrowth.dto;

import java.math.BigDecimal;

public class PlatformShare {
    private String platform;
    private long count;
    private BigDecimal value;

    public PlatformShare() {}

    public PlatformShare(String platform, long count, BigDecimal value) {
        this.platform = platform;
        this.count = count;
        this.value = value;
    }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public long getCount() { return count; }
    public void setCount(long count) { this.count = count; }

    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }

    // Builder
    public static PlatformShareBuilder builder() {
        return new PlatformShareBuilder();
    }

    public static class PlatformShareBuilder {
        private String platform;
        private long count;
        private BigDecimal value;

        PlatformShareBuilder() {}

        public PlatformShareBuilder platform(String platform) { this.platform = platform; return this; }
        public PlatformShareBuilder count(long count) { this.count = count; return this; }
        public PlatformShareBuilder value(BigDecimal value) { this.value = value; return this; }

        public PlatformShare build() {
            return new PlatformShare(platform, count, value);
        }
    }
}
