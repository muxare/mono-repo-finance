using Api.Models.DTOs;
using System.Net;
using System.Text.Json;

namespace Api.Middleware;

/// <summary>
/// Global exception handling middleware for consistent error responses
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
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
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";        var errorResponse = new ErrorResponse
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            TraceId = context.TraceIdentifier,
            Instance = context.Request.Path
        };

        switch (exception)
        {
            case ArgumentNullException:
                errorResponse.Status = (int)HttpStatusCode.BadRequest;
                errorResponse.Title = "Bad Request";
                errorResponse.Detail = exception.Message;
                break;
                
            case ArgumentException:
                errorResponse.Status = (int)HttpStatusCode.BadRequest;
                errorResponse.Title = "Bad Request";
                errorResponse.Detail = exception.Message;
                break;
                
            case KeyNotFoundException:
                errorResponse.Status = (int)HttpStatusCode.NotFound;
                errorResponse.Title = "Not Found";
                errorResponse.Detail = exception.Message;
                break;
                
            case UnauthorizedAccessException:
                errorResponse.Status = (int)HttpStatusCode.Unauthorized;
                errorResponse.Title = "Unauthorized";
                errorResponse.Detail = exception.Message;
                break;
                
            case TimeoutException:
                errorResponse.Status = (int)HttpStatusCode.RequestTimeout;
                errorResponse.Title = "Request Timeout";
                errorResponse.Detail = exception.Message;
                break;
                
            default:
                errorResponse.Status = (int)HttpStatusCode.InternalServerError;
                errorResponse.Title = "Internal Server Error";
                errorResponse.Detail = "An unexpected error occurred while processing your request.";
                break;
        }

        response.StatusCode = errorResponse.Status;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        var jsonResponse = JsonSerializer.Serialize(errorResponse, jsonOptions);
        await response.WriteAsync(jsonResponse);
    }
}
