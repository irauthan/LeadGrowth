using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using LeadGrowth.Data;
using LeadGrowth.DTOs;
using LeadGrowth.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LeadGrowth.Services;

public class LeadImportService : ILeadImportService
{
    private readonly LeadGrowthDbContext _context;
    private readonly IWebSocketManagerService _webSocketManager;

    public LeadImportService(LeadGrowthDbContext context, IWebSocketManagerService webSocketManager)
    {
        _context = context;
        _webSocketManager = webSocketManager;
    }

    public byte[] GenerateSampleTemplate()
    {
        using var workbook = new XLWorkbook();
        
        // 1. Data Entry Sheet
        var ws = workbook.Worksheets.Add("Lead Intake Template");
        ws.TabColor = XLColor.FromHtml("#4F46E5");

        // Headers
        var headers = new string[]
        {
            "Full Name *",
            "Email Address *",
            "Phone Number",
            "Company / Organization",
            "Source Platform",
            "Campaign Name",
            "Priority",
            "Status",
            "City / Location",
            "Proposal Amount ($)",
            "Client Notes / Remarks"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            cell.Style.Border.OutsideBorderColor = XLColor.FromHtml("#334155");
        }
        ws.Row(1).Height = 28;

        // Sample Data Rows
        var sampleRows = new (string Name, string Email, string Phone, string Company, string Source, string Campaign, string Priority, string Status, string Location, double Amount, string Notes)[]
        {
            ("Rahul Sharma", "rahul.sharma@techcorp.in", "+91 9876543210", "TechCorp Solutions", "Google Ads", "Q3 Tech Growth", "HOT", "New", "Mumbai, India", 25000, "Interested in Enterprise Cloud CRM bundle"),
            ("Priya Patel", "priya.patel@apexventures.com", "+91 9823456789", "Apex Ventures Ltd", "LinkedIn Ads", "Enterprise Inbound", "WARM", "New", "Bengaluru, India", 15000, "Requested product walkthrough for 20 sales agents"),
            ("Amit Verma", "amit.verma@globalretail.co", "+1 4155552671", "Global Retail Logistics", "Meta", "Direct Outreach", "HIGH", "New", "San Francisco, USA", 38000, "Budget approved. Wants follow-up call this Thursday"),
            ("Neha Gupta", "neha.gupta@fintechplus.io", "+91 9123456780", "FintechPlus", "Website", "Organic Inbound", "MEDIUM", "New", "Delhi, India", 8500, "Looking for automated lead distribution engine")
        };

        for (int r = 0; r < sampleRows.Length; r++)
        {
            int rowNum = r + 2;
            var data = sampleRows[r];

            ws.Cell(rowNum, 1).Value = data.Name;
            ws.Cell(rowNum, 2).Value = data.Email;
            ws.Cell(rowNum, 3).Value = data.Phone;
            ws.Cell(rowNum, 4).Value = data.Company;
            ws.Cell(rowNum, 5).Value = data.Source;
            ws.Cell(rowNum, 6).Value = data.Campaign;
            ws.Cell(rowNum, 7).Value = data.Priority;
            ws.Cell(rowNum, 8).Value = data.Status;
            ws.Cell(rowNum, 9).Value = data.Location;
            ws.Cell(rowNum, 10).Value = data.Amount;
            ws.Cell(rowNum, 11).Value = data.Notes;

            var rowStyle = ws.Row(rowNum).Style;
            rowStyle.Alignment.Vertical = XLAlignmentVerticalValues.Center;
            if (r % 2 == 1)
            {
                rowStyle.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            }
        }

        ws.Columns().AdjustToContents();
        ws.Column(1).Width = 22;
        ws.Column(2).Width = 30;
        ws.Column(3).Width = 20;
        ws.Column(4).Width = 25;
        ws.Column(5).Width = 18;
        ws.Column(6).Width = 22;
        ws.Column(7).Width = 15;
        ws.Column(8).Width = 14;
        ws.Column(9).Width = 22;
        ws.Column(10).Width = 20;
        ws.Column(11).Width = 45;

        // 2. Instructions Sheet
        var helpWs = workbook.Worksheets.Add("Intake Guide & Rules");
        helpWs.TabColor = XLColor.FromHtml("#059669");

        helpWs.Cell(1, 1).Value = "Lead Intake & Import Guide";
        helpWs.Cell(1, 1).Style.Font.Bold = true;
        helpWs.Cell(1, 1).Style.Font.FontSize = 16;
        helpWs.Cell(1, 1).Style.Font.FontColor = XLColor.FromHtml("#1E293B");

        var instructions = new string[]
        {
            "1. REQUIRED FIELDS: 'Full Name' is mandatory. Either 'Email Address' or 'Phone Number' must be provided.",
            "2. DUPLICATE CHECK: System automatically cross-checks against existing workspace leads by Email & Phone Number.",
            "3. AUTO ASSIGNMENT: If you select Auto-Assign during intake, leads are intelligently distributed to available active sales reps.",
            "4. PRIORITY VALUES: Recommended values are HOT, WARM, COLD, HIGH, MEDIUM, LOW.",
            "5. STATUS VALUES: Default is 'New'. You can also use 'Contacted', 'Qualified', etc.",
            "6. FILE FORMATS: Both Excel (.xlsx, .xls) and CSV (.csv) formats are fully supported with auto-mapping.",
            "7. CUSTOM COLUMNS: You can use your own column names; the importer will automatically detect and match synonyms."
        };

        for (int i = 0; i < instructions.Length; i++)
        {
            helpWs.Cell(i + 3, 1).Value = instructions[i];
            helpWs.Cell(i + 3, 1).Style.Font.FontSize = 11;
        }

        helpWs.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<LeadImportPreviewResponse> ParseAndPreviewAsync(IFormFile file, string userEmail)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
        }

        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || user.WorkspaceId == null)
        {
            throw new InvalidOperationException("User does not belong to a valid workspace.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        List<Dictionary<string, string>> rawRows = new();
        List<string> detectedHeaders = new();

        if (ext == ".csv" || ext == ".txt")
        {
            (detectedHeaders, rawRows) = ParseCsvStream(file.OpenReadStream());
        }
        else if (ext == ".xlsx" || ext == ".xls")
        {
            (detectedHeaders, rawRows) = ParseExcelStream(file.OpenReadStream());
        }
        else
        {
            throw new ArgumentException("Unsupported file type. Please upload .xlsx, .xls, or .csv.");
        }

        if (detectedHeaders.Count == 0 || rawRows.Count == 0)
        {
            throw new ArgumentException("The uploaded file does not contain any lead records or valid headers.");
        }

        // Detect column mappings based on synonyms
        var mappings = DetectColumnMappings(detectedHeaders);

        // Fetch existing leads in workspace for duplicate lookup
        var existingLeads = await _context.Leads
            .Where(l => l.WorkspaceId == user.WorkspaceId.Value)
            .Select(l => new { l.Id, l.Email, l.Phone })
            .ToListAsync();

        var existingEmailMap = existingLeads
            .Where(l => !string.IsNullOrWhiteSpace(l.Email))
            .GroupBy(l => l.Email.Trim().ToLower())
            .ToDictionary(g => g.Key, g => g.First().Id);

        var existingPhoneMap = existingLeads
            .Where(l => !string.IsNullOrWhiteSpace(l.Phone))
            .GroupBy(l => NormalizePhone(l.Phone!))
            .Where(g => !string.IsNullOrWhiteSpace(g.Key))
            .ToDictionary(g => g.Key, g => g.First().Id);

        var previewRows = new List<LeadImportRowDto>();
        int rowNumber = 1;

        foreach (var raw in rawRows)
        {
            rowNumber++;
            var rowDto = new LeadImportRowDto
            {
                RowNumber = rowNumber,
                Name = GetMappedValue(raw, mappings, "name"),
                Email = GetMappedValue(raw, mappings, "email"),
                Phone = GetMappedValue(raw, mappings, "phone"),
                Company = GetMappedValue(raw, mappings, "company"),
                SourcePlatform = GetMappedValue(raw, mappings, "sourcePlatform"),
                CampaignName = GetMappedValue(raw, mappings, "campaignName"),
                Priority = GetMappedValue(raw, mappings, "priority"),
                Status = GetMappedValue(raw, mappings, "status"),
                Location = GetMappedValue(raw, mappings, "location"),
                ClientNotes = GetMappedValue(raw, mappings, "clientNotes")
            };

            // Parse proposal amount if present
            var amountStr = GetMappedValue(raw, mappings, "proposalAmount");
            if (!string.IsNullOrWhiteSpace(amountStr))
            {
                var cleanAmount = Regex.Replace(amountStr, @"[^\d\.]", "");
                if (double.TryParse(cleanAmount, NumberStyles.Any, CultureInfo.InvariantCulture, out var amt))
                {
                    rowDto.ProposalAmount = amt;
                }
            }

            // Validations
            if (string.IsNullOrWhiteSpace(rowDto.Name))
            {
                rowDto.IsValid = false;
                rowDto.ValidationErrors.Add("Full Name is required.");
            }

            if (string.IsNullOrWhiteSpace(rowDto.Email) && string.IsNullOrWhiteSpace(rowDto.Phone))
            {
                rowDto.IsValid = false;
                rowDto.ValidationErrors.Add("Either Email or Phone number is required.");
            }
            else if (!string.IsNullOrWhiteSpace(rowDto.Email) && !IsValidEmail(rowDto.Email))
            {
                rowDto.IsValid = false;
                rowDto.ValidationErrors.Add($"Invalid email format: '{rowDto.Email}'.");
            }

            // Duplicate Detection
            if (!string.IsNullOrWhiteSpace(rowDto.Email))
            {
                var normEmail = rowDto.Email.Trim().ToLower();
                if (existingEmailMap.TryGetValue(normEmail, out var existingId))
                {
                    rowDto.IsDuplicate = true;
                    rowDto.DuplicateReason = $"Duplicate Email matching existing Lead #{existingId}.";
                    rowDto.ExistingLeadId = existingId;
                }
            }

            if (!rowDto.IsDuplicate && !string.IsNullOrWhiteSpace(rowDto.Phone))
            {
                var normPhone = NormalizePhone(rowDto.Phone);
                if (!string.IsNullOrWhiteSpace(normPhone) && existingPhoneMap.TryGetValue(normPhone, out var existingId))
                {
                    rowDto.IsDuplicate = true;
                    rowDto.DuplicateReason = $"Duplicate Phone matching existing Lead #{existingId}.";
                    rowDto.ExistingLeadId = existingId;
                }
            }

            previewRows.Add(rowDto);
        }

        var response = new LeadImportPreviewResponse
        {
            TotalRows = previewRows.Count,
            ValidRows = previewRows.Count(r => r.IsValid && !r.IsDuplicate),
            DuplicateRows = previewRows.Count(r => r.IsDuplicate),
            InvalidRows = previewRows.Count(r => !r.IsValid),
            DetectedColumns = detectedHeaders,
            ColumnMappings = mappings,
            Rows = previewRows
        };

        return response;
    }

    public async Task<LeadImportResultDto> ExecuteImportAsync(LeadImportExecuteRequest request, string userEmail)
    {
        if (request == null || request.Rows == null || request.Rows.Count == 0)
        {
            throw new ArgumentException("No rows provided for intake.");
        }

        var email = userEmail.Trim().ToLower();
        var user = await _context.Users
            .Include(u => u.Workspace)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || user.WorkspaceId == null)
        {
            throw new InvalidOperationException("User does not belong to a valid workspace.");
        }

        long workspaceId = user.WorkspaceId.Value;
        bool isManagerOrAdmin = user.Roles.Any(r => r.Name == "ROLE_ADMIN" || r.Name == "ROLE_MANAGER");

        // Validate Campaign if specified
        Campaign? targetCampaign = null;
        if (request.CampaignId.HasValue && request.CampaignId.Value > 0)
        {
            targetCampaign = await _context.Campaigns.FirstOrDefaultAsync(c => c.Id == request.CampaignId.Value && c.WorkspaceId == workspaceId);
        }

        // Determine Assignee Setup
        User? specificAssignee = null;
        if (request.AssignmentStrategy == "ME")
        {
            specificAssignee = user;
        }
        else if (request.AssignmentStrategy == "SPECIFIC" && request.AssignedToId.HasValue && request.AssignedToId.Value > 0)
        {
            // If standard user, they cannot assign to others unless manager/admin
            if (!isManagerOrAdmin && request.AssignedToId.Value != user.Id)
            {
                specificAssignee = user;
            }
            else
            {
                specificAssignee = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.AssignedToId.Value && u.WorkspaceId == workspaceId);
            }
        }

        // Preload active sales pool if Auto Assignment is requested
        List<User> salesPool = new();
        if (request.AssignmentStrategy == "AUTO")
        {
            salesPool = await GetEligibleAssigneesAsync(workspaceId);
        }

        var existingLeads = await _context.Leads
            .Where(l => l.WorkspaceId == workspaceId)
            .ToListAsync();

        var existingEmailMap = existingLeads
            .Where(l => !string.IsNullOrWhiteSpace(l.Email))
            .GroupBy(l => l.Email.Trim().ToLower())
            .ToDictionary(g => g.Key, g => g.First());

        var existingPhoneMap = existingLeads
            .Where(l => !string.IsNullOrWhiteSpace(l.Phone))
            .GroupBy(l => NormalizePhone(l.Phone!))
            .Where(g => !string.IsNullOrWhiteSpace(g.Key))
            .ToDictionary(g => g.Key, g => g.First());

        var result = new LeadImportResultDto
        {
            TotalProcessed = request.Rows.Count
        };

        var newLeadsToInsert = new List<Lead>();
        int updatedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;
        int roundRobinIndex = 0;

        foreach (var row in request.Rows)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(row.Name))
                {
                    errorCount++;
                    result.Messages.Add($"Row {row.RowNumber}: Skipped because Name is blank.");
                    continue;
                }

                var normEmail = !string.IsNullOrWhiteSpace(row.Email) ? row.Email.Trim().ToLower() : null;
                var normPhone = !string.IsNullOrWhiteSpace(row.Phone) ? NormalizePhone(row.Phone) : null;

                Lead? matchedExisting = null;
                if (normEmail != null && existingEmailMap.TryGetValue(normEmail, out var match1))
                {
                    matchedExisting = match1;
                }
                else if (normPhone != null && existingPhoneMap.TryGetValue(normPhone, out var match2))
                {
                    matchedExisting = match2;
                }

                // Handle Duplicates
                if (matchedExisting != null)
                {
                    if (request.DuplicateStrategy == "SKIP")
                    {
                        skippedCount++;
                        continue;
                    }
                    else if (request.DuplicateStrategy == "UPDATE")
                    {
                        // Update existing lead record
                        if (!string.IsNullOrWhiteSpace(row.Phone)) matchedExisting.Phone = row.Phone.Trim();
                        if (!string.IsNullOrWhiteSpace(row.Company)) matchedExisting.Company = row.Company.Trim();
                        if (!string.IsNullOrWhiteSpace(row.Location)) matchedExisting.Location = row.Location.Trim();
                        if (!string.IsNullOrWhiteSpace(row.Priority)) matchedExisting.Priority = NormalizePriority(row.Priority);
                        if (!string.IsNullOrWhiteSpace(row.ClientNotes))
                        {
                            matchedExisting.ClientNotes = string.IsNullOrWhiteSpace(matchedExisting.ClientNotes) 
                                ? $"[Updated via Excel Intake {DateTime.UtcNow:yyyy-MM-dd}]: {row.ClientNotes.Trim()}"
                                : $"{matchedExisting.ClientNotes}\n[Updated via Excel Intake {DateTime.UtcNow:yyyy-MM-dd}]: {row.ClientNotes.Trim()}";
                        }
                        if (row.ProposalAmount.HasValue && row.ProposalAmount.Value > 0)
                        {
                            matchedExisting.ProposalAmount = row.ProposalAmount.Value;
                        }

                        updatedCount++;
                        continue;
                    }
                    // If "ALLOW", proceed to insert as new lead
                }

                // Determine Assignee for new lead
                User? leadAssignee = null;
                string? strategyNote = null;

                if (request.AssignmentStrategy == "ME")
                {
                    leadAssignee = user;
                    strategyNote = "Assigned to Creator via Excel Intake.";
                }
                else if (request.AssignmentStrategy == "SPECIFIC")
                {
                    leadAssignee = specificAssignee ?? user;
                    strategyNote = $"Assigned to {leadAssignee.FullName} via Excel Intake.";
                }
                else if (request.AssignmentStrategy == "AUTO")
                {
                    if (salesPool.Count > 0)
                    {
                        leadAssignee = salesPool[roundRobinIndex % salesPool.Count];
                        roundRobinIndex++;
                        strategyNote = "Assigned via Auto Smart Round-Robin Intake.";
                    }
                    else
                    {
                        strategyNote = "Auto-assign requested but no active sales reps found. Added to Queue.";
                    }
                }
                else
                {
                    strategyNote = "Direct Intake to Workspace Queue.";
                }

                var sourcePlatform = !string.IsNullOrWhiteSpace(row.SourcePlatform) 
                    ? row.SourcePlatform.Trim() 
                    : (!string.IsNullOrWhiteSpace(request.DefaultSourcePlatform) ? request.DefaultSourcePlatform : "Excel Intake");

                var priority = !string.IsNullOrWhiteSpace(row.Priority) 
                    ? NormalizePriority(row.Priority) 
                    : NormalizePriority(request.DefaultPriority);

                var status = !string.IsNullOrWhiteSpace(row.Status) 
                    ? row.Status.Trim() 
                    : (!string.IsNullOrWhiteSpace(request.DefaultStatus) ? request.DefaultStatus : "New");

                var newLead = new Lead
                {
                    WorkspaceId = workspaceId,
                    CampaignId = targetCampaign?.Id,
                    Name = row.Name.Trim(),
                    Email = !string.IsNullOrWhiteSpace(row.Email) ? row.Email.Trim() : $"{Guid.NewGuid().ToString("N")[..8]}@no-email.intake",
                    Phone = row.Phone?.Trim(),
                    Company = row.Company?.Trim(),
                    SourcePlatform = sourcePlatform,
                    CampaignName = targetCampaign?.Name ?? row.CampaignName?.Trim(),
                    Priority = priority,
                    Status = status,
                    Location = row.Location?.Trim(),
                    ClientNotes = row.ClientNotes?.Trim(),
                    ProposalAmount = row.ProposalAmount,
                    AssignedToId = leadAssignee?.Id,
                    AssignedById = leadAssignee != null ? user.Id : null,
                    AssignedDate = leadAssignee != null ? DateTime.UtcNow : null,
                    ProgressPercentage = leadAssignee != null ? 10 : 0,
                    QueueStatus = (leadAssignee != null && leadAssignee.Id != user.Id) ? "ASSIGNED" : "IN_PIPELINE",
                    QualityScore = CalculateQualityScore(priority, row.Company, row.ProposalAmount),
                    QualityTier = CalculateQualityTier(priority),
                    ConversionProbability = CalculateConversionProbability(priority),
                    CreatedAt = DateTime.UtcNow
                };

                newLeadsToInsert.Add(newLead);
            }
            catch (Exception ex)
            {
                errorCount++;
                result.Messages.Add($"Row {row.RowNumber}: Processing error — {ex.Message}");
            }
        }

        // Batch Insert Leads
        if (newLeadsToInsert.Count > 0)
        {
            _context.Leads.AddRange(newLeadsToInsert);
            await _context.SaveChangesAsync();

            if (targetCampaign != null)
            {
                targetCampaign.LeadsCount += newLeadsToInsert.Count;
            }

            // Create Assignments, Logs and Notifications
            var newAssignments = new List<LeadAssignment>();
            var newAssignLogs = new List<AssignmentLog>();
            var newNotifications = new List<Notification>();

            foreach (var l in newLeadsToInsert)
            {
                result.CreatedLeadIds.Add(l.Id);

                if (l.AssignedToId.HasValue)
                {
                    newAssignments.Add(new LeadAssignment
                    {
                        LeadId = l.Id,
                        UserId = l.AssignedToId.Value,
                        AssignedAt = DateTime.UtcNow
                    });

                    newAssignLogs.Add(new AssignmentLog
                    {
                        WorkspaceId = workspaceId,
                        LeadId = l.Id,
                        UserId = l.AssignedToId.Value,
                        Strategy = "Assigned via Excel / CSV Intake Engine",
                        AssignedAt = DateTime.UtcNow
                    });

                    if (l.AssignedToId.Value != user.Id)
                    {
                        newNotifications.Add(new Notification
                        {
                            UserId = l.AssignedToId.Value,
                            Title = "New Lead Assigned from Excel Intake",
                            Message = $"New lead \"{l.Name}\" ({l.SourcePlatform}) has been imported and assigned to you.",
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
                else
                {
                    newAssignLogs.Add(new AssignmentLog
                    {
                        WorkspaceId = workspaceId,
                        LeadId = l.Id,
                        UserId = user.Id,
                        Strategy = "Ingested into Workspace Lead Queue via Excel Intake.",
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }

            if (newAssignments.Count > 0) _context.LeadAssignments.AddRange(newAssignments);
            if (newAssignLogs.Count > 0) _context.AssignmentLogs.AddRange(newAssignLogs);
            if (newNotifications.Count > 0) _context.Notifications.AddRange(newNotifications);

            // Create Audit Log
            _context.AuditLogs.Add(new AuditLog
            {
                WorkspaceId = workspaceId,
                UserId = user.Id,
                Action = "EXCEL_LEAD_INTAKE",
                Description = $"Successfully ingested {newLeadsToInsert.Count} leads into workspace. Strategy: {request.AssignmentStrategy}, Updated: {updatedCount}, Skipped: {skippedCount}.",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // Realtime Broadcast
            try
            {
                await _webSocketManager.BroadcastWorkspaceNotificationAsync(workspaceId, new
                {
                    type = "BULK_LEAD_INTAKE",
                    count = newLeadsToInsert.Count,
                    importedBy = user.FullName,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception wsEx)
            {
                Console.WriteLine($"[LeadImportService] Realtime broadcast error: {wsEx.Message}");
            }
        }
        else if (updatedCount > 0)
        {
            await _context.SaveChangesAsync();
        }

        result.Success = true;
        result.ImportedCount = newLeadsToInsert.Count;
        result.UpdatedCount = updatedCount;
        result.SkippedCount = skippedCount;
        result.ErrorCount = errorCount;
        result.Messages.Add($"Intake Complete! Ingested: {result.ImportedCount}, Updated: {result.UpdatedCount}, Skipped: {result.SkippedCount}, Errors: {result.ErrorCount}.");

        return result;
    }

    private static (List<string> Headers, List<Dictionary<string, string>> Rows) ParseExcelStream(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var ws = workbook.Worksheets.FirstOrDefault();
        if (ws == null) return (new List<string>(), new List<Dictionary<string, string>>());

        var firstRow = ws.FirstRowUsed();
        if (firstRow == null) return (new List<string>(), new List<Dictionary<string, string>>());

        var headers = new List<string>();
        int lastCol = firstRow.LastCellUsed()?.Address.ColumnNumber ?? 0;

        for (int c = 1; c <= lastCol; c++)
        {
            var headerVal = ws.Cell(firstRow.RowNumber(), c).GetString().Trim();
            if (!string.IsNullOrWhiteSpace(headerVal))
            {
                headers.Add(headerVal);
            }
            else
            {
                headers.Add($"Column_{c}");
            }
        }

        var rows = new List<Dictionary<string, string>>();
        var usedRows = ws.RowsUsed().Skip(1);

        foreach (var r in usedRows)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            bool hasAnyData = false;

            for (int c = 1; c <= headers.Count; c++)
            {
                var cellVal = ws.Cell(r.RowNumber(), c).GetString().Trim();
                if (!string.IsNullOrEmpty(cellVal))
                {
                    hasAnyData = true;
                }
                dict[headers[c - 1]] = cellVal;
            }

            if (hasAnyData)
            {
                rows.Add(dict);
            }
        }

        return (headers, rows);
    }

    private static (List<string> Headers, List<Dictionary<string, string>> Rows) ParseCsvStream(Stream stream)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var lines = new List<string>();
        while (!reader.EndOfStream)
        {
            var line = reader.ReadLine();
            if (!string.IsNullOrWhiteSpace(line)) lines.Add(line);
        }

        if (lines.Count == 0) return (new List<string>(), new List<Dictionary<string, string>>());

        var headers = ParseCsvLine(lines[0]);
        var rows = new List<Dictionary<string, string>>();

        for (int i = 1; i < lines.Count; i++)
        {
            var values = ParseCsvLine(lines[i]);
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            bool hasData = false;

            for (int c = 0; c < headers.Count; c++)
            {
                var val = c < values.Count ? values[c].Trim() : string.Empty;
                if (!string.IsNullOrEmpty(val)) hasData = true;
                dict[headers[c]] = val;
            }

            if (hasData)
            {
                rows.Add(dict);
            }
        }

        return (headers, rows);
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var pattern = @"(?<=^|,)(?:""(?<val>(?:[^""]|"""")*)""|(?<val>[^,]*))";
        foreach (Match m in Regex.Matches(line, pattern))
        {
            var val = m.Groups["val"].Value.Replace("\"\"", "\"").Trim();
            result.Add(val);
        }
        return result;
    }

    private static Dictionary<string, string> DetectColumnMappings(List<string> headers)
    {
        var mapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        var synonyms = new Dictionary<string, string[]>
        {
            ["name"] = new[] { "full name", "fullname", "name", "customer name", "lead name", "contact name", "client name", "person" },
            ["email"] = new[] { "email", "email address", "mail", "e-mail", "email id", "email address *" },
            ["phone"] = new[] { "phone", "phone number", "mobile", "mobile number", "contact", "contact number", "contact no", "telephone", "phone number *" },
            ["company"] = new[] { "company", "company name", "organization", "organisation", "business", "firm", "agency", "company / organization" },
            ["sourcePlatform"] = new[] { "source", "source platform", "platform", "lead source", "channel", "origin" },
            ["campaignName"] = new[] { "campaign", "campaign name", "campaign_name", "campaign id" },
            ["priority"] = new[] { "priority", "lead priority", "urgency", "tier", "importance" },
            ["status"] = new[] { "status", "lead status", "stage", "pipeline stage", "state" },
            ["location"] = new[] { "location", "city", "city / location", "state", "country", "address", "region" },
            ["proposalAmount"] = new[] { "proposal amount", "proposal amount ($)", "budget", "amount", "deal value", "deal size", "value", "price" },
            ["clientNotes"] = new[] { "client notes", "client notes / remarks", "notes", "remarks", "comment", "comments", "description", "details" }
        };

        foreach (var standardField in synonyms.Keys)
        {
            var candidates = synonyms[standardField];
            foreach (var header in headers)
            {
                var clean = CleanHeader(header);
                if (candidates.Any(c => clean == c || clean.Contains(c) || c.Contains(clean)))
                {
                    mapping[standardField] = header;
                    break;
                }
            }
        }

        return mapping;
    }

    private static string CleanHeader(string h)
    {
        return Regex.Replace(h.ToLowerInvariant(), @"[\*_\-\.\/]", " ").Trim().Replace("  ", " ");
    }

    private static string GetMappedValue(Dictionary<string, string> row, Dictionary<string, string> mappings, string fieldKey)
    {
        if (mappings.TryGetValue(fieldKey, out var headerName) && row.TryGetValue(headerName, out var val))
        {
            return val?.Trim() ?? string.Empty;
        }
        return string.Empty;
    }

    private static bool IsValidEmail(string email)
    {
        return Regex.IsMatch(email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    }

    private static string NormalizePhone(string phone)
    {
        return Regex.Replace(phone, @"[^\d\+]", "");
    }

    private static string NormalizePriority(string? p)
    {
        if (string.IsNullOrWhiteSpace(p)) return "MEDIUM";
        var norm = p.Trim().ToUpper();
        return norm switch
        {
            "HOT" or "HIGH" => "HIGH",
            "WARM" or "MEDIUM" => "MEDIUM",
            "COLD" or "LOW" => "LOW",
            _ => "MEDIUM"
        };
    }

    private static int CalculateQualityScore(string priority, string? company, double? amount)
    {
        int score = priority switch
        {
            "HIGH" => 85,
            "MEDIUM" => 75,
            "LOW" => 60,
            _ => 70
        };

        if (!string.IsNullOrWhiteSpace(company)) score += 5;
        if (amount.HasValue && amount.Value > 10000) score += 10;
        return Math.Min(score, 99);
    }

    private static string CalculateQualityTier(string priority)
    {
        return priority switch
        {
            "HIGH" => "HOT",
            "MEDIUM" => "WARM",
            _ => "COLD"
        };
    }

    private static double CalculateConversionProbability(string priority)
    {
        return priority switch
        {
            "HIGH" => 85.0,
            "MEDIUM" => 65.0,
            _ => 40.0
        };
    }

    private async Task<List<User>> GetEligibleAssigneesAsync(long? workspaceId)
    {
        if (workspaceId == null) return new List<User>();

        var allMembers = await _context.Users
            .Include(u => u.Roles)
            .Where(u => u.WorkspaceId == workspaceId && u.Status != "SUSPENDED" && u.CanReceiveLeads)
            .ToListAsync();

        // 1. Filter out Admins: Smart Round-Robin should strictly distribute to Sales Executives / Reps
        var salesExecutives = allMembers.Where(u =>
            u.Roles == null || u.Roles.Count == 0 || !u.Roles.Any(r => r.Name.Contains("ADMIN", StringComparison.OrdinalIgnoreCase))
        ).ToList();

        // If sales executives exist in the workspace, distribute strictly among them
        if (salesExecutives.Count > 0)
        {
            return salesExecutives.OrderBy(u => u.LastAssignedAt ?? DateTime.MinValue).ToList();
        }

        // Fallback only if no sales reps exist in the workspace at all
        return allMembers.OrderBy(u => u.LastAssignedAt ?? DateTime.MinValue).ToList();
    }
}
