using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Commands;
using System.Security.Claims;
using Application.DTOs;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IMediator _mediator;

    public FeedbackController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitFeedback([FromBody] FeedbackDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
            return Unauthorized();

        var command = new SubmitFeedbackCommand(
            dto.MessageId,
            Guid.Parse(userIdClaim),
            dto.Score,
            dto.Comment
        );

        await _mediator.Send(command);
        return Ok(new { message = "Feedback enregistré avec succès" });
    }
}