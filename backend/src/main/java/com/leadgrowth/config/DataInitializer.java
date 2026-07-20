package com.leadgrowth.config;

import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final LeadRepository leadRepository;
    private final LeadNoteRepository leadNoteRepository;
    private final TaskRepository taskRepository;
    private final IntegrationRepository integrationRepository;
    private final AdMetricsRepository adMetricsRepository;
    private final ActivityLogRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            WorkspaceRepository workspaceRepository,
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            LeadRepository leadRepository,
            LeadNoteRepository leadNoteRepository,
            TaskRepository taskRepository,
            IntegrationRepository integrationRepository,
            AdMetricsRepository adMetricsRepository,
            ActivityLogRepository activityLogRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.leadRepository = leadRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.taskRepository = taskRepository;
        this.integrationRepository = integrationRepository;
        this.adMetricsRepository = adMetricsRepository;
        this.activityLogRepository = activityLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Roles
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));
        Role managerRole = roleRepository.findByName("ROLE_MANAGER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_MANAGER").build()));
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

        // 2. Seed Default Workspace
        Workspace workspace;
        if (workspaceRepository.count() == 0) {
            workspace = workspaceRepository.save(Workspace.builder()
                    .name("Demo Agency Workspace")
                    .companyName("Lead Growth Inc.")
                    .industry("Digital Marketing")
                    .teamSize(15)
                    .website("https://leadgrowth.com")
                    .timezone("UTC+5:30")
                    .inviteCode("LEAD-GROWTH-2026")
                    .slug("demo-agency-workspace")
                    .build());
        } else {
            workspace = workspaceRepository.findAll().get(0);
        }

        // 3. Seed Users
        User adminUser = null;
        User managerUser = null;
        User standardUser = null;

        // Admins
        if (!userRepository.existsByEmail("rahul@leadgrowth.com")) {
            adminUser = userRepository.save(User.builder()
                    .email("rahul@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Rahul Sharma")
                    .designation("CEO & Founder")
                    .department("Management")
                    .bio("Admin of Lead Growth workspace. Managing all operations.")
                    .phone("+91 98765 43210")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(adminRole)))
                    .status("ACTIVE")
                    .build());
        } else {
            adminUser = userRepository.findByEmail("rahul@leadgrowth.com").orElse(null);
        }

        if (!userRepository.existsByEmail("priya@leadgrowth.com")) {
            userRepository.save(User.builder()
                    .email("priya@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Priya Verma")
                    .designation("Co-Founder & VP")
                    .department("Management")
                    .bio("Admin of Lead Growth. Leading growth strategy.")
                    .phone("+91 98765 43211")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(adminRole)))
                    .status("ACTIVE")
                    .build());
        }

        // Managers
        if (!userRepository.existsByEmail("amit@leadgrowth.com")) {
            managerUser = userRepository.save(User.builder()
                    .email("amit@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Amit Kumar")
                    .designation("Marketing Manager")
                    .department("Marketing")
                    .bio("Overseeing team tasks and lead pipeline conversions.")
                    .phone("+91 87654 32109")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(managerRole)))
                    .status("ACTIVE")
                    .build());
        } else {
            managerUser = userRepository.findByEmail("amit@leadgrowth.com").orElse(null);
        }

        if (!userRepository.existsByEmail("neha@leadgrowth.com")) {
            userRepository.save(User.builder()
                    .email("neha@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Neha Singh")
                    .designation("Sales Manager")
                    .department("Sales")
                    .bio("Managing sales pipeline and customer acquisition.")
                    .phone("+91 87654 32110")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(managerRole)))
                    .status("ACTIVE")
                    .build());
        }

        // Users
        if (!userRepository.existsByEmail("rohit@leadgrowth.com")) {
            standardUser = userRepository.save(User.builder()
                    .email("rohit@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Rohit Patel")
                    .designation("Lead Specialist")
                    .department("Marketing")
                    .bio("Focused on contacting new prospects and qualifying leads.")
                    .phone("+91 76543 21098")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(userRole)))
                    .status("ACTIVE")
                    .build());
        } else {
            standardUser = userRepository.findByEmail("rohit@leadgrowth.com").orElse(null);
        }

        if (!userRepository.existsByEmail("ankit@leadgrowth.com")) {
            userRepository.save(User.builder()
                    .email("ankit@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Ankit Gupta")
                    .designation("Sales Representative")
                    .department("Sales")
                    .bio("Converting qualified leads into enterprise deals.")
                    .phone("+91 76543 21099")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(userRole)))
                    .status("ACTIVE")
                    .build());
        }

        if (!userRepository.existsByEmail("pooja@leadgrowth.com")) {
            userRepository.save(User.builder()
                    .email("pooja@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Pooja Yadav")
                    .designation("Customer Success")
                    .department("Support")
                    .bio("Helping clients implement marketing dashboard settings.")
                    .phone("+91 76543 21100")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(userRole)))
                    .status("ACTIVE")
                    .build());
        }

        if (!userRepository.existsByEmail("vikas@leadgrowth.com")) {
            userRepository.save(User.builder()
                    .email("vikas@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Vikas Sharma")
                    .designation("Marketing Associate")
                    .department("Marketing")
                    .bio("Optimizing Meta Ads and search campaigns copy.")
                    .phone("+91 76543 21101")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(userRole)))
                    .status("ACTIVE")
                    .build());
        }

        if (!userRepository.existsByEmail("sneha@leadgrowth.com")) {
            userRepository.save(User.builder()
                    .email("sneha@leadgrowth.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .fullName("Sneha Jain")
                    .designation("SEO Analyst")
                    .department("Marketing")
                    .bio("Researching keywords and building conversion funnels.")
                    .phone("+91 76543 21102")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(userRole)))
                    .status("ACTIVE")
                    .build());
        }

        // 4. Seed Campaigns
        if (campaignRepository.count() == 0) {
            Campaign c1 = campaignRepository.save(Campaign.builder()
                    .workspace(workspace)
                    .name("Meta Mid-Summer Deal")
                    .platform("Meta")
                    .status("Active")
                    .spend(new BigDecimal("4500.00"))
                    .clicks(15800)
                    .impressions(389000)
                    .leadsCount(420)
                    .conversions(98)
                    .revenue(new BigDecimal("12400.00"))
                    .build());

            Campaign c2 = campaignRepository.save(Campaign.builder()
                    .workspace(workspace)
                    .name("Google Search - Enterprise CRM")
                    .platform("Google")
                    .status("Active")
                    .spend(new BigDecimal("7800.00"))
                    .clicks(24500)
                    .impressions(520000)
                    .leadsCount(680)
                    .conversions(154)
                    .revenue(new BigDecimal("21600.00"))
                    .build());

            Campaign c3 = campaignRepository.save(Campaign.builder()
                    .workspace(workspace)
                    .name("Instagram Video Promo")
                    .platform("Meta")
                    .status("Paused")
                    .spend(new BigDecimal("1200.00"))
                    .clicks(4900)
                    .impressions(120000)
                    .leadsCount(110)
                    .conversions(22)
                    .revenue(new BigDecimal("2800.00"))
                    .build());

            // 5. Seed Ad Metrics (for Recharts trends)
            LocalDate today = LocalDate.now();
            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                adMetricsRepository.save(AdMetrics.builder()
                        .workspace(workspace)
                        .campaign(c1)
                        .platform("Meta")
                        .spend(new BigDecimal("600").add(new BigDecimal(Math.random() * 100)))
                        .clicks(2000 + (int)(Math.random() * 500))
                        .impressions(50000 + (int)(Math.random() * 10000))
                        .conversions(12 + (int)(Math.random() * 6))
                        .date(date)
                        .build());

                adMetricsRepository.save(AdMetrics.builder()
                        .workspace(workspace)
                        .campaign(c2)
                        .platform("Google")
                        .spend(new BigDecimal("1000").add(new BigDecimal(Math.random() * 150)))
                        .clicks(3200 + (int)(Math.random() * 600))
                        .impressions(70000 + (int)(Math.random() * 12000))
                        .conversions(20 + (int)(Math.random() * 8))
                        .date(date)
                        .build());
            }

            // 6. Seed Leads
            List<String> names = Arrays.asList("Aarav Sharma", "Priya Patel", "Amit Verma", "Neha Gupta", "Rahul Singh", "Ananya Iyer", "Vikram Malhotra", "Siddharth Rao", "Divya Nair", "Kabir Joshi");
            List<String> emails = Arrays.asList("aarav@example.com", "priya@example.com", "amit@example.com", "neha@example.com", "rahul@example.com", "ananya@example.com", "vikram@example.com", "siddharth@example.com", "divya@example.com", "kabir@example.com");
            List<String> phones = Arrays.asList("+91 99999 11111", "+91 99999 22222", "+91 99999 33333", "+91 99999 44444", "+91 99999 55555", "+91 99999 66666", "+91 99999 77777", "+91 99999 88888", "+91 99999 99999", "+91 99999 00000");
            List<String> platforms = Arrays.asList("Meta", "Google", "Meta", "Google", "Meta", "Google", "Meta", "Google", "Meta", "Google");
            List<String> statuses = Arrays.asList("New", "Contacted", "Qualified", "Converted", "Rejected", "New", "Contacted", "Qualified", "Converted", "New");
            List<Campaign> campaigns = Arrays.asList(c1, c2, c1, c2, c3, c1, c2, c1, c2, c1);

            for (int i = 0; i < names.size(); i++) {
                Lead lead = leadRepository.save(Lead.builder()
                        .workspace(workspace)
                        .campaign(campaigns.get(i))
                        .name(names.get(i))
                        .email(emails.get(i))
                        .phone(phones.get(i))
                        .sourcePlatform(platforms.get(i))
                        .campaignName(campaigns.get(i).getName())
                        .status(statuses.get(i))
                        .assignedTo(i % 2 == 0 ? standardUser : managerUser)
                        .build());

                // Seed some notes
                if (i % 3 == 0) {
                    leadNoteRepository.save(LeadNote.builder()
                            .lead(lead)
                            .user(managerUser)
                            .note("Called client, they are highly interested in enterprise scale solutions. Need to schedule follow-up presentation next Tuesday.")
                            .build());
                }
            }

            // 7. Seed Tasks
            taskRepository.save(Task.builder()
                    .workspace(workspace)
                    .title("Review Google Ads Campaign performance metrics")
                    .description("Verify if CTR is within target and optimize ad copy.")
                    .assignedTo(managerUser)
                    .dueDate(LocalDate.now().plusDays(2))
                    .priority("High")
                    .status("Pending")
                    .build());

            taskRepository.save(Task.builder()
                    .workspace(workspace)
                    .title("Call Qualified Meta leads")
                    .description("Follow up with Aarav and Amit on the CRM proposal details.")
                    .assignedTo(standardUser)
                    .dueDate(LocalDate.now().plusDays(1))
                    .priority("High")
                    .status("In_Progress")
                    .build());

            taskRepository.save(Task.builder()
                    .workspace(workspace)
                    .title("Export monthly spend summary")
                    .description("Prepare spreadsheets for executive meeting budget breakdown.")
                    .assignedTo(adminUser)
                    .dueDate(LocalDate.now().minusDays(1))
                    .priority("Medium")
                    .status("Completed")
                    .build());

            // 8. Seed Integrations
            integrationRepository.save(Integration.builder()
                    .workspace(workspace)
                    .platform("Meta")
                    .apiKey("mock_meta_api_key_xxxxxxxxxxxxx")
                    .status("Connected")
                    .lastSyncedAt(LocalDateTime.now().minusHours(1))
                    .build());

            integrationRepository.save(Integration.builder()
                    .workspace(workspace)
                    .platform("Google")
                    .apiKey("mock_google_api_key_yyyyyyyyyyyyy")
                    .status("Connected")
                    .lastSyncedAt(LocalDateTime.now().minusHours(1))
                    .build());

            // 9. Seed Activity logs
            activityLogRepository.save(ActivityLog.builder()
                    .workspace(workspace)
                    .user(adminUser)
                    .action("WORKSPACE_CREATE")
                    .description("Workspace Demo Agency Workspace initialized.")
                    .build());

            activityLogRepository.save(ActivityLog.builder()
                    .workspace(workspace)
                    .user(adminUser)
                    .action("INTEGRATION_CONNECT")
                    .description("Connected Meta Marketing API integration successfully.")
                    .build());

            activityLogRepository.save(ActivityLog.builder()
                    .workspace(workspace)
                    .user(managerUser)
                    .action("TASK_ASSIGN")
                    .description("Assigned task 'Call Qualified Meta leads' to Daniel Carter.")
                    .build());
        }
    }
}
