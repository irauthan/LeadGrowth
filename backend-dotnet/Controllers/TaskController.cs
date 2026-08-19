using System.Security.Claims;
using LeadGrowth.DTOs;
using LeadGrowth.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeadGrowth.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetTasks()
    {
        var email = GetUserEmail();
        try
        {
            var tasks = await _taskService.GetTasksAsync(email);
            return Ok(tasks);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<TaskDto>>> GetTodayTasks()
    {
        var email = GetUserEmail();
        var tasks = await _taskService.GetTodayTasksAsync(email);
        return Ok(tasks);
    }

    [HttpGet("completed")]
    public async Task<ActionResult<List<TaskDto>>> GetCompletedTasks()
    {
        var email = GetUserEmail();
        var tasks = await _taskService.GetCompletedTasksAsync(email);
        return Ok(tasks);
    }

    [HttpGet("overdue")]
    public async Task<ActionResult<List<TaskDto>>> GetOverdueTasks()
    {
        var email = GetUserEmail();
        var tasks = await _taskService.GetOverdueTasksAsync(email);
        return Ok(tasks);
    }

    [HttpPost]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] TaskDto dto)
    {
        var email = GetUserEmail();
        try
        {
            var task = await _taskService.CreateTaskAsync(dto, email);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("convert-from-lead/{leadId}")]
    public async Task<ActionResult<TaskDto>> ConvertFromLead(long leadId, [FromBody] Dictionary<string, string>? payload)
    {
        var email = GetUserEmail();
        var customTitle = payload != null && payload.ContainsKey("title") ? payload["title"] : null;
        try
        {
            var task = await _taskService.ConvertLeadToTaskAsync(leadId, customTitle, email);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<TaskDto>> UpdateTaskStatus(long id, [FromQuery] string status)
    {
        var email = GetUserEmail();
        try
        {
            var task = await _taskService.UpdateTaskStatusAsync(id, status, email);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<IActionResult> DeleteTask(long id)
    {
        var email = GetUserEmail();
        try
        {
            await _taskService.DeleteTaskAsync(id, email);
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("bulk-assign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<List<TaskDto>>> BulkAssign([FromQuery] List<long> taskIds, [FromQuery] long userId)
    {
        var email = GetUserEmail();
        var tasks = await _taskService.BulkAssignTasksAsync(taskIds, userId, email);
        return Ok(tasks);
    }

    [HttpPost("bulk-random-assign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<List<TaskDto>>> BulkRandomAssign([FromQuery] List<long> taskIds)
    {
        var email = GetUserEmail();
        var tasks = await _taskService.BulkRandomAssignTasksAsync(taskIds, email);
        return Ok(tasks);
    }

    [HttpPost("bulk-status")]
    public async Task<ActionResult<List<TaskDto>>> BulkStatus([FromQuery] List<long> taskIds, [FromQuery] string status)
    {
        var email = GetUserEmail();
        var tasks = await _taskService.BulkUpdateStatusAsync(taskIds, status, email);
        return Ok(tasks);
    }

    [HttpPost("{id}/auto-assign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<TaskDto>> AutoAssignTask(long id)
    {
        var email = GetUserEmail();
        try
        {
            var task = await _taskService.AutoAssignTaskAsync(id, email);
            return Ok(task);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<TaskDto>> ApproveTask(long id)
    {
        var email = GetUserEmail();
        var task = await _taskService.ApproveTaskAsync(id, email);
        return Ok(task);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<TaskDto>> RejectTask(long id)
    {
        var email = GetUserEmail();
        var task = await _taskService.RejectTaskAsync(id, email);
        return Ok(task);
    }

    [HttpPost("{id}/suspend")]
    public async Task<ActionResult<TaskDto>> SuspendTask(long id)
    {
        var email = GetUserEmail();
        var task = await _taskService.SuspendTaskAsync(id, email);
        return Ok(task);
    }

    [HttpPost("{id}/reassign")]
    [Authorize(Policy = "RequireManagerOrAdmin")]
    public async Task<ActionResult<TaskDto>> ReassignTask(long id, [FromQuery] long userId)
    {
        var email = GetUserEmail();
        try
        {
            var task = await _taskService.ReassignTaskAsync(id, userId, email);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reschedule")]
    public async Task<ActionResult<TaskDto>> RescheduleTask(long id, [FromBody] RescheduleTaskRequest request)
    {
        var email = GetUserEmail();
        try
        {
            var task = await _taskService.RescheduleTaskAsync(id, request, email);
            return Ok(task);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
    }
}
