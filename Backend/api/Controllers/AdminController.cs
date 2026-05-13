using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Commands;
using Application.DTOs;
using Application.Queries;
using Domain.Enums;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Manager")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ===================== GET ALL USERS =====================
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _mediator.Send(new GetAllUsersQuery());
        return Ok(users);
    }

    // ===================== REGISTER USER =====================
    [HttpPost("users/register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RegisterUser([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var command = new RegisterUserCommand(request.Email, request.Password, request.Role);
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetAllUsers), new { }, result);
    }

    // ===================== UPDATE USER ROLE =====================
    [HttpPut("users/{id:guid}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] UpdateUserRoleRequest request)
    {
        if (!Enum.IsDefined(typeof(UserRole), request.Role))
            return BadRequest("Rôle invalide.");

        await _mediator.Send(new UpdateUserRoleCommand(id, request.Role));
        return NoContent();
    }

    // ===================== DELETE USER =====================
    [HttpDelete("users/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await _mediator.Send(new DeleteUserCommand(id));
        return NoContent();
    }

    // ===================== STATS =====================
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _mediator.Send(new GetAdminStatsQuery());
        return Ok(result);
    }

    // ===================== RECENT ACTIVITY =====================
    [HttpGet("activity")]
    public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 20)
    {
        if (limit is < 1 or > 100)
            return BadRequest("limit doit être entre 1 et 100.");

        var result = await _mediator.Send(new GetRecentActivityQuery(limit));
        return Ok(result);
    }

    // ===================== EXPORT RAPPORT =====================
    [HttpGet("export")]
    public async Task<IActionResult> ExportReport()
    {
        var report = await _mediator.Send(new ExportReportQuery());
        var json = JsonSerializer.Serialize(report, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new JsonStringEnumConverter() }
        });
        var bytes = System.Text.Encoding.UTF8.GetBytes(json);
        var fileName = $"rapport_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
        return File(bytes, "application/json", fileName);
    }
}

public record UpdateUserRoleRequest(UserRole Role);