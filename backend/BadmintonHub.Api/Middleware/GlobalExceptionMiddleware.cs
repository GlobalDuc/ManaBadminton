using System.Net;
using System.Text.Json;
using FluentValidation;

namespace BadmintonHub.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred on {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            ValidationException => (int)HttpStatusCode.BadRequest,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var message = exception switch
        {
            ValidationException vex => string.Join(" ", vex.Errors.Select(e => e.ErrorMessage)),
            UnauthorizedAccessException or KeyNotFoundException or InvalidOperationException => exception.Message,
            _ => "Đã xảy ra lỗi hệ thống trên máy chủ. Vui lòng thử lại sau."
        };

        context.Response.StatusCode = statusCode;
        var payload = JsonSerializer.Serialize(new
        {
            statusCode,
            message,
            timestamp = DateTime.UtcNow
        });

        await context.Response.WriteAsync(payload);
    }
}
