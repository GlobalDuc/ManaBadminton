using System.Security.Claims;
using BadmintonHub.Application.DTOs;
using BadmintonHub.Application.Interfaces;
using BadmintonHub.Domain.Enums;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BadmintonHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    private readonly IValidator<LoginRequestDto> _validator;

    public AuthController(IBadmintonHubService service, IValidator<LoginRequestDto> validator)
    {
        _service = service;
        _validator = validator;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        var result = await _service.LoginAsync(dto, ct);
        return Ok(result);
    }
}

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IBadmintonHubService _service;

    public DashboardController(IBadmintonHubService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken ct)
        => Ok(await _service.GetDashboardSummaryAsync(ct));
}

[ApiController]
[Route("api/venues")]
public class VenuesController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    public VenuesController(IBadmintonHubService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VenueDto>>> GetAll(CancellationToken ct)
        => Ok(await _service.GetVenuesAsync(ct));

    [HttpPost]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<VenueDto>> Create([FromBody] SaveVenueDto dto, CancellationToken ct)
        => Ok(await _service.CreateVenueAsync(dto, User.Identity?.Name ?? "admin", ct));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<VenueDto>> Update(int id, [FromBody] SaveVenueDto dto, CancellationToken ct)
        => Ok(await _service.UpdateVenueAsync(id, dto, User.Identity?.Name ?? "admin", ct));
}

[ApiController]
[Route("api/courts")]
public class CourtsController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    public CourtsController(IBadmintonHubService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CourtDto>>> GetAll([FromQuery] int? venueId, CancellationToken ct)
        => Ok(await _service.GetCourtsAsync(venueId, ct));

    [HttpPost]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<CourtDto>> Create([FromBody] SaveCourtDto dto, CancellationToken ct)
        => Ok(await _service.CreateCourtAsync(dto, User.Identity?.Name ?? "admin", ct));

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<CourtDto>> Update(int id, [FromBody] SaveCourtDto dto, CancellationToken ct)
        => Ok(await _service.UpdateCourtAsync(id, dto, User.Identity?.Name ?? "admin", ct));
}

[ApiController]
[Route("api/players")]
public class PlayersController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    private readonly IValidator<SavePlayerDto> _validator;

    public PlayersController(IBadmintonHubService service, IValidator<SavePlayerDto> validator)
    {
        _service = service;
        _validator = validator;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<PlayerDto>>> GetPlayers(
        [FromQuery] string? search,
        [FromQuery] SkillLevel? skillLevel,
        [FromQuery] MembershipType? membershipType,
        [FromQuery] bool? onlyActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _service.GetPlayersAsync(search, skillLevel, membershipType, onlyActive, page, pageSize, ct));

    [HttpPost]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<PlayerDto>> Create([FromBody] SavePlayerDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        return Ok(await _service.CreatePlayerAsync(dto, User.Identity?.Name ?? "admin", ct));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<PlayerDto>> Update(int id, [FromBody] SavePlayerDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        return Ok(await _service.UpdatePlayerAsync(id, dto, User.Identity?.Name ?? "admin", ct));
    }
}

[ApiController]
[Route("api/sessions")]
public class SessionsController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    private readonly IValidator<SaveSessionDto> _validator;

    public SessionsController(IBadmintonHubService service, IValidator<SaveSessionDto> validator)
    {
        _service = service;
        _validator = validator;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<SessionDto>>> GetSessions(
        [FromQuery] SessionStatus? status,
        [FromQuery] int? venueId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _service.GetSessionsAsync(status, venueId, page, pageSize, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SessionDto>> GetById(int id, CancellationToken ct)
        => Ok(await _service.GetSessionByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<SessionDto>> Create([FromBody] SaveSessionDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        return Ok(await _service.CreateSessionAsync(dto, User.Identity?.Name ?? "admin", ct));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<SessionDto>> Update(int id, [FromBody] SaveSessionDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        return Ok(await _service.UpdateSessionAsync(id, dto, User.Identity?.Name ?? "admin", ct));
    }

    [HttpGet("{id:int}/registrations")]
    public async Task<ActionResult<IReadOnlyList<SessionRegistrationDto>>> GetRegistrations(int id, CancellationToken ct)
        => Ok(await _service.GetSessionRegistrationsAsync(id, ct));

    [HttpPost("{id:int}/registrations")]
    public async Task<ActionResult<SessionRegistrationDto>> Register(int id, [FromBody] RegisterSessionPlayerDto dto, CancellationToken ct)
        => Ok(await _service.RegisterPlayerToSessionAsync(id, dto, User.Identity?.Name ?? "member", ct));

    [HttpDelete("{id:int}/registrations/{playerId:int}")]
    public async Task<IActionResult> CancelRegistration(int id, int playerId, CancellationToken ct)
    {
        await _service.CancelRegistrationAsync(id, playerId, User.Identity?.Name ?? "member", ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/attendance")]
public class AttendanceController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    public AttendanceController(IBadmintonHubService service) => _service = service;

    [HttpGet("session/{sessionId:int}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceItemDto>>> GetBySession(int sessionId, CancellationToken ct)
        => Ok(await _service.GetSessionAttendancesAsync(sessionId, ct));

    [HttpPost]
    public async Task<ActionResult<AttendanceItemDto>> Upsert([FromBody] UpdateAttendanceDto dto, CancellationToken ct)
        => Ok(await _service.UpsertAttendanceAsync(dto, User.Identity?.Name ?? "admin", ct));

    [HttpPost("session/{sessionId:int}/initialize")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<IReadOnlyList<AttendanceItemDto>>> InitializeFromRegistrations(int sessionId, CancellationToken ct)
        => Ok(await _service.InitializeAttendanceFromRegistrationsAsync(sessionId, User.Identity?.Name ?? "admin", ct));
}

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    private readonly IValidator<CreatePaymentDto> _validator;

    public PaymentsController(IBadmintonHubService service, IValidator<CreatePaymentDto> validator)
    {
        _service = service;
        _validator = validator;
    }

    [HttpGet("charges")]
    public async Task<ActionResult<IReadOnlyList<SessionChargeDto>>> GetCharges(
        [FromQuery] int? sessionId,
        [FromQuery] ChargePaymentStatus? status,
        [FromQuery] int? playerId,
        CancellationToken ct = default)
        => Ok(await _service.GetSessionChargesAsync(sessionId, status, playerId, ct));

    [HttpPost("charges/calculate")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<IReadOnlyList<SessionChargeDto>>> CalculateCharges([FromBody] CalculateSessionChargesDto dto, CancellationToken ct)
        => Ok(await _service.CalculateSessionChargesAsync(dto, User.Identity?.Name ?? "thuquy", ct));

    [HttpGet("transactions")]
    public async Task<ActionResult<PagedResultDto<PaymentTransactionDto>>> GetTransactions(
        [FromQuery] int? playerId,
        [FromQuery] PaymentMethod? method,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
        => Ok(await _service.GetPaymentsAsync(playerId, method, page, pageSize, ct));

    [HttpPost("transactions")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<PaymentTransactionDto>> CreatePayment([FromBody] CreatePaymentDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        return Ok(await _service.CreatePaymentAsync(dto, User.Identity?.Name ?? "thuquy", ct));
    }
}

[ApiController]
[Route("api/expenses")]
public class ExpensesController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    private readonly IValidator<SaveExpenseDto> _validator;

    public ExpensesController(IBadmintonHubService service, IValidator<SaveExpenseDto> validator)
    {
        _service = service;
        _validator = validator;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<ExpenseDto>>> GetExpenses(
        [FromQuery] ExpenseCategory? category,
        [FromQuery] int? sessionId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
        => Ok(await _service.GetExpensesAsync(category, sessionId, page, pageSize, ct));

    [HttpPost]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<ExpenseDto>> Create([FromBody] SaveExpenseDto dto, CancellationToken ct)
    {
        await _validator.ValidateAndThrowAsync(dto, ct);
        return Ok(await _service.CreateExpenseAsync(dto, User.Identity?.Name ?? "thuquy", ct));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteExpenseAsync(id, User.Identity?.Name ?? "admin", ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/court-assignments")]
public class CourtAssignmentsController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    public CourtAssignmentsController(IBadmintonHubService service) => _service = service;

    [HttpGet("session/{sessionId:int}")]
    public async Task<ActionResult<IReadOnlyList<CourtAssignmentDto>>> GetBySession(int sessionId, CancellationToken ct)
        => Ok(await _service.GetCourtAssignmentsAsync(sessionId, ct));

    [HttpPost]
    public async Task<ActionResult<CourtAssignmentDto>> Create([FromBody] SaveCourtAssignmentDto dto, CancellationToken ct)
        => Ok(await _service.SaveCourtAssignmentAsync(null, dto, User.Identity?.Name ?? "admin", ct));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CourtAssignmentDto>> Update(int id, [FromBody] SaveCourtAssignmentDto dto, CancellationToken ct)
        => Ok(await _service.SaveCourtAssignmentAsync(id, dto, User.Identity?.Name ?? "admin", ct));

    [HttpPost("session/{sessionId:int}/auto-generate")]
    public async Task<ActionResult<IReadOnlyList<CourtAssignmentDto>>> AutoGenerate(int sessionId, CancellationToken ct)
        => Ok(await _service.AutoGenerateCourtAssignmentsAsync(sessionId, User.Identity?.Name ?? "admin", ct));
}

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    public NotificationsController(IBadmintonHubService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetAll(CancellationToken ct)
        => Ok(await _service.GetNotificationsAsync(ct));

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        await _service.MarkNotificationReadAsync(id, ct);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _service.MarkAllNotificationsReadAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly IBadmintonHubService _service;
    public SettingsController(IBadmintonHubService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ClubSettingDto>> GetSettings(CancellationToken ct)
        => Ok(await _service.GetClubSettingAsync(ct));

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClubSettingDto>> UpdateSettings([FromBody] ClubSettingDto dto, CancellationToken ct)
        => Ok(await _service.UpdateClubSettingAsync(dto, User.Identity?.Name ?? "admin", ct));

    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin,Treasurer")]
    public async Task<ActionResult<IReadOnlyList<AuditLogDto>>> GetAuditLogs([FromQuery] int count = 30, CancellationToken ct = default)
        => Ok(await _service.GetRecentAuditLogsAsync(count, ct));
}
