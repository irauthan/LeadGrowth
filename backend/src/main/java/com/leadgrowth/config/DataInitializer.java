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

        if (!userRepository.existsByEmail("admin@leadgrowth.com")) {
            adminUser = userRepository.save(User.builder()
                    .email("admin@leadgrowth.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("Alexander Wright")
                    .designation("CEO & Founder")
                    .bio("Admin of Lead Growth workspace. Managing all digital campaigns.")
                    .phone("+1 (555) 019-2834")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(adminRole)))
                    .build());
        } else {
            adminUser = userRepository.findByEmail("admin@leadgrowth.com").orElse(null);
        }

        if (!userRepository.existsByEmail("manager@leadgrowth.com")) {
            managerUser = userRepository.save(User.builder()
                    .email("manager@leadgrowth.com")
                    .password(passwordEncoder.encode("Manager@123"))
                    .fullName("Sarah Jenkins")
                    .designation("Marketing Manager")
                    .bio("Overseeing team tasks and lead pipeline conversions.")
                    .phone("+1 (555) 014-9988")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(managerRole)))
                    .build());
        } else {
            managerUser = userRepository.findByEmail("manager@leadgrowth.com").orElse(null);
        }

        if (!userRepository.existsByEmail("user@leadgrowth.com")) {
            standardUser = userRepository.save(User.builder()
                    .email("user@leadgrowth.com")
                    .password(passwordEncoder.encode("User@123"))
                    .fullName("Daniel Carter")
                    .designation("Lead Specialist")
                    .bio("Focused on contacting new prospects and qualifying leads.")
                    .phone("+1 (555) 012-3344")
                    .workspace(workspace)
                    .roles(new HashSet<>(List.of(userRole)))
                    .build());
        } else {
            standardUser = userRepository.findByEmail("user@leadgrowth.com").orElse(null);
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
            List<String> names = Arrays.asList("Sophia Williams", "Liam Johnson", "Olivia Martinez", "Noah Davis", "Emma Rodriguez", "Jackson Brown", "Ava Wilson", "Lucas Garcia", "Isabella Martinez", "Mason Taylor");
            List<String> emails = Arrays.asList("sophia@example.com", "liam@example.com", "olivia@example.com", "noah@example.com", "emma@example.com", "jackson@example.com", "ava@example.com", "lucas@example.com", "isabella@example.com", "mason@example.com");
            List<String> phones = Arrays.asList("+1 (555) 234-5678", "+1 (555) 876-5432", "+1 (555) 345-6789", "+1 (555) 987-6543", "+1 (555) 456-7890", "+1 (555) 098-7654", "+1 (555) 567-8901", "+1 (555) 109-8765", "+1 (555) 678-9012", "+1 (555) 210-9876");
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
                    .description("Follow up with Sophia and Olivia on the CRM proposal details.")
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
