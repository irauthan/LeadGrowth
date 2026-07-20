package com.leadgrowth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadgrowth.dto.*;
import com.leadgrowth.entity.*;
import com.leadgrowth.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class LeadGrowthApplicationTests {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private WorkspaceRepository workspaceRepository;

        @Autowired
        private RoleRepository roleRepository;

        @Autowired
        private LeadRepository leadRepository;

        @Autowired
        private TaskRepository taskRepository;

        @Autowired
        private InvitationRepository invitationRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private PasswordResetTokenRepository passwordResetTokenRepository;

        @Autowired
        private EmailVerificationTokenRepository emailVerificationTokenRepository;

        @Autowired
        private RefreshTokenRepository refreshTokenRepository;

        @Autowired
        private UserSessionRepository userSessionRepository;

        private String adminToken;
        private String userToken;
        private Long workspaceId;
        private User seedAdmin;
        private User seedUser;

        @BeforeEach
        public void setup() throws Exception {
                // Setup initial roles if not present
                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));
                Role managerRole = roleRepository.findByName("ROLE_MANAGER")
                                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_MANAGER").build()));
                Role userRole = roleRepository.findByName("ROLE_USER")
                                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

                // Create Workspace
                Workspace ws = workspaceRepository.save(Workspace.builder()
                                .name("Testing Workspace")
                                .inviteCode("TEST-INV-123")
                                .slug("testing-workspace")
                                .build());
                workspaceId = ws.getId();

                // Create Admin user
                seedAdmin = userRepository.save(User.builder()
                                .email("admin-test@leadgrowth.com")
                                .password(passwordEncoder.encode("Password@123"))
                                .fullName("Admin Test")
                                .workspace(ws)
                                .status("ACTIVE")
                                .roles(new java.util.HashSet<>(java.util.Set.of(adminRole)))
                                .build());

                // Create Regular user
                seedUser = userRepository.save(User.builder()
                                .email("user-test@leadgrowth.com")
                                .password(passwordEncoder.encode("Password@123"))
                                .fullName("User Test")
                                .workspace(ws)
                                .status("ACTIVE")
                                .roles(new java.util.HashSet<>(java.util.Set.of(userRole)))
                                .build());

                // Obtain admin JWT
                LoginRequest adminLogin = new LoginRequest("admin-test@leadgrowth.com", "Password@123", false);
                MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(adminLogin)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<?, ?> adminResp = objectMapper.readValue(adminResult.getResponse().getContentAsString(), Map.class);
                adminToken = "Bearer " + adminResp.get("token").toString();

                // Obtain user JWT
                LoginRequest userLogin = new LoginRequest("user-test@leadgrowth.com", "Password@123", false);
                MvcResult userResult = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(userLogin)))
                                .andExpect(status().isOk())
                                .andReturn();

                Map<?, ?> userResp = objectMapper.readValue(userResult.getResponse().getContentAsString(), Map.class);
                userToken = "Bearer " + userResp.get("token").toString();
        }

        @Test
        public void testAuthEndpoints() throws Exception {
                // 1. Signup Wizard (Create Workspace Action)
                RegisterRequest registerReq = new RegisterRequest();
                registerReq.setEmail("wizard-new@leadgrowth.com");
                registerReq.setPassword("NewPass@123");
                registerReq.setConfirmPassword("NewPass@123");
                registerReq.setFullName("Wizard User");
                registerReq.setPhone("+91 99999 88888");
                registerReq.setWorkspaceAction("CREATE");
                registerReq.setWorkspaceName("Wizard Workspace");
                registerReq.setCompanyName("Wizard Company");

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.workspaceName").value("Wizard Workspace"));

                // 2. Signup Wizard (Join Workspace Action)
                RegisterRequest joinReq = new RegisterRequest();
                joinReq.setEmail("wizard-join@leadgrowth.com");
                joinReq.setPassword("NewPass@123");
                joinReq.setConfirmPassword("NewPass@123");
                joinReq.setFullName("Wizard Joiner");
                joinReq.setPhone("+91 99999 88889");
                joinReq.setWorkspaceAction("JOIN");
                joinReq.setInviteCode("TEST-INV-123");

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(joinReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.workspaceName").value("Testing Workspace"));
        }

        @Test
        public void testUserAdministration() throws Exception {
                // 1. Invite Team Member (Enforce Manager invitation role lock)
                // Admin invites user: OK
                UserInviteRequest adminInvite = new UserInviteRequest("invite-test@example.com", "USER");
                mockMvc.perform(post("/api/users/invite")
                                .header("Authorization", adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(adminInvite)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("PENDING"))
                                .andExpect(jsonPath("$.role").value("USER"));

                // 2. Edit User details
                UserProfileRequest editReq = new UserProfileRequest("User Test Upd", "+91 88888 77777", "Director",
                                "My New Bio", null, "Sales");
                mockMvc.perform(put("/api/users/" + seedUser.getId() + "/details")
                                .header("Authorization", adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(editReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.fullName").value("User Test Upd"))
                                .andExpect(jsonPath("$.department").value("Sales"));

                // 3. Reset Password
                mockMvc.perform(post("/api/users/" + seedUser.getId() + "/reset-password?newPassword=Password@567")
                                .header("Authorization", adminToken))
                                .andExpect(status().isOk());

                // Login with new reset password should work
                LoginRequest loginReset = new LoginRequest("user-test@leadgrowth.com", "Password@567", false);
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReset)))
                                .andExpect(status().isOk());
        }

        @Test
        public void testWorkloadBalancedTaskAssignment() throws Exception {
                // Seed 3 tasks to Regular user, 1 task to Admin user
                Workspace ws = workspaceRepository.findById(workspaceId).get();
                for (int i = 0; i < 3; i++) {
                        taskRepository.save(Task.builder()
                                        .title("Task Load " + i)
                                        .status("Pending")
                                        .priority("Medium")
                                        .workspace(ws)
                                        .assignedTo(seedUser)
                                        .build());
                }
                taskRepository.save(Task.builder()
                                .title("Task Load Admin")
                                .status("Pending")
                                .priority("Medium")
                                .workspace(ws)
                                .assignedTo(seedAdmin)
                                .build());

                // Create new task and assign via auto-load balancer (assignedToId = -1)
                TaskDto taskDto = TaskDto.builder()
                                .title("Balanced Task")
                                .description("Auto assigned task to lowest load")
                                .dueDate(java.time.LocalDate.parse("2026-08-30"))
                                .priority("Medium")
                                .status("Pending")
                                .assignedToId(-1L)
                                .build();

                MvcResult res = mockMvc.perform(post("/api/tasks")
                                .header("Authorization", adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(taskDto)))
                                .andExpect(status().isOk())
                                .andReturn();

                TaskDto resultDto = objectMapper.readValue(res.getResponse().getContentAsString(), TaskDto.class);
                // It must be assigned to admin because admin has 1 pending task, user has 3
                // pending tasks
                assertEquals(seedAdmin.getId(), resultDto.getAssignedToId());
        }

        @Test
        public void testWorkloadBalancedLeadAssignment() throws Exception {
                Workspace ws = workspaceRepository.findById(workspaceId).get();
                // Seed 4 leads to seedUser, 1 lead to seedAdmin
                for (int i = 0; i < 4; i++) {
                        leadRepository.save(Lead.builder()
                                        .name("Lead " + i)
                                        .email("lead" + i + "@example.com")
                                        .status("New")
                                        .workspace(ws)
                                        .assignedTo(seedUser)
                                        .build());
                }
                leadRepository.save(Lead.builder()
                                .name("Lead Admin")
                                .email("leadadmin@example.com")
                                .status("New")
                                .workspace(ws)
                                .assignedTo(seedAdmin)
                                .build());

                // Perform bulk random workload balanced assignment for 2 leads
                Lead l1 = leadRepository.save(Lead.builder().name("Bulk Lead 1").email("bulk1@example.com").status("New").workspace(ws).build());
                Lead l2 = leadRepository.save(Lead.builder().name("Bulk Lead 2").email("bulk2@example.com").status("New").workspace(ws).build());

                mockMvc.perform(post("/api/leads/bulk-random-assign?leadIds=" + l1.getId() + "," + l2.getId())
                                .header("Authorization", adminToken))
                                .andExpect(status().isOk());

                // Retrieve and assert: lead 1 goes to admin (load: 1), lead 2 goes to admin
                // (load: 2), user still has load 4
                Lead res1 = leadRepository.findById(l1.getId()).get();
                Lead res2 = leadRepository.findById(l2.getId()).get();
                assertEquals(seedAdmin.getId(), res1.getAssignedTo().getId());
                assertEquals(seedAdmin.getId(), res2.getAssignedTo().getId());
        }

        @Test
        public void testGlobalSearchSystem() throws Exception {
                Workspace ws = workspaceRepository.findById(workspaceId).get();
                // Seed search records
                leadRepository.save(Lead.builder().name("Aarav Sharma Lead").email("aarav@example.com").status("New").workspace(ws).build());
                taskRepository.save(Task.builder().title("Review Google Ads").status("Pending").priority("Medium")
                                .workspace(ws).build());

                // Perform Global Search for "Aarav"
                mockMvc.perform(get("/api/dashboard/search?q=Aarav")
                                .header("Authorization", adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                                .andExpect(jsonPath("$[0].title", containsString("Aarav")));

                // Perform Global Search for "Google"
                mockMvc.perform(get("/api/dashboard/search?q=Google")
                                .header("Authorization", adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                                .andExpect(jsonPath("$[0].title", containsString("Google")));
        }

        @Test
        public void testWorkspaceManagementAndOwnershipTransfer() throws Exception {
                // 1. Get current workspace
                mockMvc.perform(get("/api/workspaces/current")
                                .header("Authorization", adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("Testing Workspace"));

                // 2. Update workspace
                WorkspaceUpdateRequest updateReq = new WorkspaceUpdateRequest(
                                "Updated Workspace Name",
                                "New Company",
                                "Tech",
                                10,
                                "https://newcomp.com",
                                "UTC",
                                "TEST-INV-123",
                                "testing-workspace-updated"
                );

                mockMvc.perform(put("/api/workspaces/current")
                                .header("Authorization", adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("Updated Workspace Name"))
                                .andExpect(jsonPath("$.companyName").value("New Company"))
                                .andExpect(jsonPath("$.slug").value("testing-workspace-updated"));

                // 3. Transfer Ownership to seedUser
                mockMvc.perform(post("/api/users/transfer-ownership?newOwnerId=" + seedUser.getId())
                                .header("Authorization", adminToken))
                                .andExpect(status().isOk());

                // Now verify seedUser is ROLE_ADMIN and seedAdmin is ROLE_MANAGER
                User updatedAdminUser = userRepository.findById(seedUser.getId()).get();
                User updatedManagerUser = userRepository.findById(seedAdmin.getId()).get();

                assertTrue(updatedAdminUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN")));
                assertTrue(updatedManagerUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_MANAGER")));
                assertFalse(updatedManagerUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN")));
        }

        @Test
        public void testInvitationFlow() throws Exception {
                // 1. Admin invites a member
                UserInviteRequest inviteReq = new UserInviteRequest("new-member@example.com", "USER");
                MvcResult inviteRes = mockMvc.perform(post("/api/users/invite")
                                .header("Authorization", adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(inviteReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("PENDING"))
                                .andReturn();

                Invitation invitation = objectMapper.readValue(inviteRes.getResponse().getContentAsString(), Invitation.class);
                String token = invitation.getToken();

                // 2. Verify invitation token
                mockMvc.perform(get("/api/invitations/verify?token=" + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.email").value("new-member@example.com"))
                                .andExpect(jsonPath("$.role").value("USER"));

                // 3. Register invited user
                RegisterInvitedRequest regReq = new RegisterInvitedRequest(
                                "Invited Full Name",
                                "new-member@example.com",
                                "+91 99999 11111",
                                "Password@123",
                                "Password@123",
                                token
                );

                mockMvc.perform(post("/api/auth/register-invited")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(regReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.email").value("new-member@example.com"));

                // 4. Verify invitation is now ACCEPTED
                Invitation acceptedInvite = invitationRepository.findByToken(token).get();
                assertEquals("ACCEPTED", acceptedInvite.getStatus());
        }

        @Test
        public void testPasswordResetFlow() throws Exception {
                // 1. Request password reset
                PasswordResetRequest resetReq = new PasswordResetRequest("user-test@leadgrowth.com");
                mockMvc.perform(post("/api/auth/password-reset/request")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(resetReq)))
                                .andExpect(status().isOk());

                // Find the token in the DB
                List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
                assertFalse(tokens.isEmpty());
                String resetToken = tokens.get(0).getToken();

                // 2. Confirm password reset
                PasswordResetConfirmRequest confirmReq = new PasswordResetConfirmRequest(
                                resetToken,
                                "NewSecure@123",
                                "NewSecure@123"
                );
                mockMvc.perform(post("/api/auth/password-reset/confirm")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(confirmReq)))
                                .andExpect(status().isOk());

                // 3. Attempt login with new password
                LoginRequest loginReq = new LoginRequest("user-test@leadgrowth.com", "NewSecure@123", false);
                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                                .andExpect(status().isOk());
        }

        @Test
        public void testEmailVerificationFlow() throws Exception {
                // 1. Request email verification
                mockMvc.perform(post("/api/auth/email-verification/request?email=user-test@leadgrowth.com")
                                .header("Authorization", userToken))
                                .andExpect(status().isOk());

                // Find the token in the DB
                List<EmailVerificationToken> tokens = emailVerificationTokenRepository.findAll();
                assertFalse(tokens.isEmpty());
                String verifyToken = tokens.get(0).getToken();

                // 2. Verify email with token
                mockMvc.perform(get("/api/auth/email-verification/verify?token=" + verifyToken))
                                .andExpect(status().isOk());

                // Check that user email is indeed verified
                User updatedUser = userRepository.findById(seedUser.getId()).get();
                assertTrue(updatedUser.isEmailVerified());
        }

        @Test
        public void testUserSessionAndRefreshTokenFlow() throws Exception {
                // 1. List user sessions
                MvcResult sessionsRes = mockMvc.perform(get("/api/auth/sessions")
                                .header("Authorization", userToken))
                                .andExpect(status().isOk())
                                .andReturn();

                List<?> sessionsList = objectMapper.readValue(sessionsRes.getResponse().getContentAsString(), List.class);
                assertFalse(sessionsList.isEmpty());

                // Retrieve the session ID
                Map<?, ?> firstSession = (Map<?, ?>) sessionsList.get(0);
                Long sessionId = Long.valueOf(firstSession.get("id").toString());

                // 2. Revoke session
                mockMvc.perform(delete("/api/auth/sessions/" + sessionId)
                                .header("Authorization", userToken))
                                .andExpect(status().isOk());

                // Check in repo that session is indeed expired
                UserSession session = userSessionRepository.findById(sessionId).get();
                assertTrue(session.isExpired());

                // 3. Refresh Token Flow
                List<RefreshToken> tokens = refreshTokenRepository.findAll();
                RefreshToken userRefreshToken = tokens.stream()
                                .filter(t -> t.getUser().getId().equals(seedUser.getId()))
                                .findFirst()
                                .orElseThrow(() -> new AssertionError("No refresh token found for seedUser"));

                RefreshTokenRequest refreshReq = new RefreshTokenRequest(userRefreshToken.getToken());
                mockMvc.perform(post("/api/auth/refresh-token")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(refreshReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.token").exists())
                                .andExpect(jsonPath("$.refreshToken").exists());
        }
}
