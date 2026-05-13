using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    [EnableRateLimiting("LoginPolicy")] // ✅ Correct en .NET 8
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var command = new LoginUserCommand(dto.Email, dto.Password);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    // ===================== LOGOUT =====================
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        return Ok(new { message = "Déconnexion réussie. Supprimez le token côté client." });
    }
}