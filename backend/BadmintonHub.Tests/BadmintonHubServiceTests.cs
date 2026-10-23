using BadmintonHub.Application.DTOs;
using BadmintonHub.Domain.Enums;
using BadmintonHub.Infrastructure.Persistence;
using BadmintonHub.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BadmintonHub.Tests;

public class BadmintonHubServiceTests
{
    private static BadmintonHubDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<BadmintonHubDbContext>()
            .UseInMemoryDatabase($"BadmintonHubTestDb_{Guid.NewGuid():N}")
            .Options;
        return new BadmintonHubDbContext(options);
    }

    private static IConfiguration CreateConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "BadmintonHub_SuperSecretKey_2026_SqlServer2016_Enterprise!",
                ["Jwt:Issuer"] = "BadmintonHub.Api",
                ["Jwt:Audience"] = "BadmintonHub.Client"
            })
            .Build();
    }

    [Fact]
    public async Task Seed_And_Login_Admin_Should_Return_Valid_JwtToken()
    {
        await using var db = CreateInMemoryContext();
        await DatabaseSeeder.SeedAsync(db);

        var service = new BadmintonHubService(db, CreateConfiguration());
        var auth = await service.LoginAsync(new LoginRequestDto("admin", "Admin@123"));

        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth.Token));
        Assert.Equal("Admin", auth.Role);
        Assert.Equal("admin", auth.Username);
    }

    [Fact]
    public async Task Prevent_Duplicate_SessionRegistration_Should_Throw_InvalidOperationException()
    {
        await using var db = CreateInMemoryContext();
        await DatabaseSeeder.SeedAsync(db);

        var service = new BadmintonHubService(db, CreateConfiguration());
        var sessions = await service.GetSessionsAsync(SessionStatus.Upcoming, null, 1, 10);
        var upcomingSession = sessions.Items.First();

        // Player 1 is already registered in s3 during seeding
        var existingRegs = await service.GetSessionRegistrationsAsync(upcomingSession.Id);
        var registeredPlayerId = existingRegs.First().PlayerId;

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterPlayerToSessionAsync(
                upcomingSession.Id,
                new RegisterSessionPlayerDto(registeredPlayerId, false, 0, "Đăng ký trùng"),
                "admin"));
    }

    [Fact]
    public async Task CalculateSessionCharges_And_CreatePayment_Should_Update_PaymentStatus_To_Paid()
    {
        await using var db = CreateInMemoryContext();
        await DatabaseSeeder.SeedAsync(db);

        var service = new BadmintonHubService(db, CreateConfiguration());
        var ongoingSessions = await service.GetSessionsAsync(SessionStatus.Ongoing, null, 1, 10);
        var session = ongoingSessions.Items.First();

        var charges = await service.CalculateSessionChargesAsync(
            new CalculateSessionChargesDto(session.Id, 16, 850000m, 60000m),
            "thuquy");

        Assert.NotEmpty(charges);
        var firstCharge = charges.First();
        Assert.True(firstCharge.TotalDue > 0);
        Assert.Equal(ChargePaymentStatus.Unpaid, firstCharge.PaymentStatus);

        var payment = await service.CreatePaymentAsync(
            new CreatePaymentDto(
                firstCharge.PlayerId,
                firstCharge.Id,
                firstCharge.TotalDue,
                PaymentMethod.VietQR,
                "VCB-TEST-1001",
                "Thanh toán đủ qua QR"),
            "thuquy");

        Assert.Equal(firstCharge.TotalDue, payment.Amount);

        var updatedCharges = await service.GetSessionChargesAsync(session.Id, null, firstCharge.PlayerId);
        Assert.Equal(ChargePaymentStatus.Paid, updatedCharges.First().PaymentStatus);
        Assert.Equal(0m, updatedCharges.First().RemainingAmount);

        // Verify duplicate ReferenceCode submission is blocked
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreatePaymentAsync(
                new CreatePaymentDto(
                    firstCharge.PlayerId,
                    null,
                    50000m,
                    PaymentMethod.VietQR,
                    "VCB-TEST-1001",
                    "Trùng mã tham chiếu"),
                "thuquy"));
    }
}
