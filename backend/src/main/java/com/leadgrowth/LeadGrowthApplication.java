package com.leadgrowth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LeadGrowthApplication {
    public static void main(String[] args) {
        SpringApplication.run(LeadGrowthApplication.class, args);
    }
}
