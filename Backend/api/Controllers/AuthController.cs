using MediatR;
using Microsoft.AspNetCore.Mvc;
using Application.Commands;
using Application.DTOs;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ===================== LOGIN =====================
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // KeyNotFoundException (email inexistant) et InvalidOperationException
        // (mauvais mot de passe) sont gérés par ErrorHandlingMiddleware → 404/400
        var command = new LoginUserCommand(dto.Email, dto.Password);
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}