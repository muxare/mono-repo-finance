using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Api.Models.Responses;

/// <summary>
/// Enhanced error response with factory methods for consistent error handling
/// </summary>
public class ApiErrorResponse
{
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public int StatusCode { get; set; }
    public string? TraceId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public List<ValidationError> ValidationErrors { get; set; } = new();

    /// <summary>
    /// Private constructor to force use of factory methods
    /// </summary>
    private ApiErrorResponse() { }

    /// <summary>
    /// Private constructor with all parameters
    /// </summary>
    private ApiErrorResponse(string message, int statusCode, string? details = null, string? traceId = null)
    {
        Message = message;
        StatusCode = statusCode;
        Details = details;
        TraceId = traceId;
        Timestamp = DateTime.UtcNow;
    }

    #region Common HTTP Error Factory Methods

    /// <summary>
    /// Creates a 400 Bad Request error response
    /// </summary>
    public static ApiErrorResponse BadRequest(string message, string? details = null, string? traceId = null)
        => new(message, 400, details, traceId);

    /// <summary>
    /// Creates a 401 Unauthorized error response
    /// </summary>
    public static ApiErrorResponse Unauthorized(string message = "Unauthorized access", string? details = null, string? traceId = null)
        => new(message, 401, details, traceId);

    /// <summary>
    /// Creates a 403 Forbidden error response
    /// </summary>
    public static ApiErrorResponse Forbidden(string message = "Access forbidden", string? details = null, string? traceId = null)
        => new(message, 403, details, traceId);

    /// <summary>
    /// Creates a 404 Not Found error response
    /// </summary>
    public static ApiErrorResponse NotFound(string message = "Resource not found", string? details = null, string? traceId = null)
        => new(message, 404, details, traceId);

    /// <summary>
    /// Creates a 409 Conflict error response
    /// </summary>
    public static ApiErrorResponse Conflict(string message, string? details = null, string? traceId = null)
        => new(message, 409, details, traceId);

    /// <summary>
    /// Creates a 422 Unprocessable Entity error response
    /// </summary>
    public static ApiErrorResponse UnprocessableEntity(string message, string? details = null, string? traceId = null)
        => new(message, 422, details, traceId);

    /// <summary>
    /// Creates a 500 Internal Server Error response
    /// </summary>
    public static ApiErrorResponse InternalServerError(string message = "An internal server error occurred", string? details = null, string? traceId = null)
        => new(message, 500, details, traceId);

    /// <summary>
    /// Creates a 503 Service Unavailable error response
    /// </summary>
    public static ApiErrorResponse ServiceUnavailable(string message = "Service temporarily unavailable", string? details = null, string? traceId = null)
        => new(message, 503, details, traceId);

    #endregion

    #region Business-Specific Factory Methods
    
    /// <summary>
    /// Creates a 404 error for a resource not found with specific type and identifier
    /// </summary>
    public static ApiErrorResponse ResourceNotFound(string resourceType, string identifier, string? traceId = null)
        => new($"{resourceType} with identifier '{identifier}' not found", 404, traceId: traceId);

    /// <summary>
    /// Creates a 409 error for a resource that already exists
    /// </summary>
    public static ApiErrorResponse ResourceAlreadyExists(string resourceType, string identifier, string? traceId = null)
        => new($"{resourceType} with identifier '{identifier}' already exists", 409, traceId: traceId);

    /// <summary>
    /// Creates a 422 error for business rule violations
    /// </summary>
    public static ApiErrorResponse BusinessRuleFailed(string rule, string message, string? details = null, string? traceId = null)
        => new($"Business rule violation: {rule}", 422, details ?? message, traceId);

    /// <summary>
    /// Creates a 403 error for insufficient permissions
    /// </summary>
    public static ApiErrorResponse InsufficientPermissions(string action, string resource, string? traceId = null)
        => new($"Insufficient permissions to {action} {resource}", 403, traceId: traceId);

    /// <summary>
    /// Creates a 400 error for invalid parameters
    /// </summary>
    public static ApiErrorResponse InvalidParameter(string parameterName, string reason, string? traceId = null)
        => new($"Invalid parameter '{parameterName}': {reason}", 400, traceId: traceId);

    /// <summary>
    /// Creates a 400 error for missing required parameters
    /// </summary>
    public static ApiErrorResponse RequiredParameterMissing(string parameterName, string? traceId = null)
        => new($"Required parameter '{parameterName}' is missing", 400, traceId: traceId);

    #endregion

    #region Validation Factory Methods
    
    /// <summary>
    /// Creates a 400 error for general validation failures
    /// </summary>
    public static ApiErrorResponse ValidationFailed(string message = "Validation failed", string? traceId = null)
    {
        var error = new ApiErrorResponse(message, 400, traceId: traceId);
        return error;
    }

    /// <summary>
    /// Creates a 400 error from ModelState validation failures
    /// </summary>
    public static ApiErrorResponse ValidationFailed(ModelStateDictionary modelState, string? traceId = null)
    {
        var error = new ApiErrorResponse("Validation failed", 400, traceId: traceId);
        
        foreach (var kvp in modelState)
        {
            foreach (var validationError in kvp.Value!.Errors)
            {
                error.ValidationErrors.Add(new ValidationError
                {
                    Field = kvp.Key,
                    Message = validationError.ErrorMessage
                });
            }
        }
        
        return error;
    }

    /// <summary>
    /// Creates a 400 error from a list of validation errors
    /// </summary>
    public static ApiErrorResponse ValidationFailed(List<ValidationError> validationErrors, string? traceId = null)
    {
        var error = new ApiErrorResponse("Validation failed", 400, traceId: traceId);
        error.ValidationErrors = validationErrors;
        return error;
    }

    #endregion

    #region Exception-Based Factory Methods
      /// <summary>
    /// Creates an appropriate error response from an exception
    /// </summary>
    public static ApiErrorResponse FromException(Exception exception, string? traceId = null, bool includeStackTrace = false)
    {
        var details = includeStackTrace ? exception.ToString() : exception.Message;
        
        return exception switch
        {
            ArgumentNullException argEx => BadRequest($"Required parameter '{argEx.ParamName}' is missing", details, traceId),
            ArgumentException => BadRequest(exception.Message, details, traceId),
            UnauthorizedAccessException => Unauthorized(exception.Message, details, traceId),
            InvalidOperationException => Conflict(exception.Message, details, traceId),
            NotImplementedException => new("Feature not implemented", 501, details, traceId),
            TimeoutException => new("Request timeout", 408, details, traceId),
            FileNotFoundException => NotFound("Requested file not found", details, traceId),
            DirectoryNotFoundException => NotFound("Requested directory not found", details, traceId),
            _ => InternalServerError("An unexpected error occurred", details, traceId)
        };
    }

    #endregion

    #region Fluent Methods
    
    /// <summary>
    /// Adds additional details to the error response
    /// </summary>
    public ApiErrorResponse WithDetails(string details)
    {
        Details = details;
        return this;
    }

    /// <summary>
    /// Sets the trace ID for the error response
    /// </summary>
    public ApiErrorResponse WithTraceId(string traceId)
    {
        TraceId = traceId;
        return this;
    }

    /// <summary>
    /// Adds a validation error to the response
    /// </summary>
    public ApiErrorResponse AddValidationError(string field, string message)
    {
        ValidationErrors.Add(new ValidationError { Field = field, Message = message });
        return this;
    }

    /// <summary>
    /// Adds multiple validation errors to the response
    /// </summary>
    public ApiErrorResponse AddValidationErrors(IEnumerable<ValidationError> errors)
    {
        ValidationErrors.AddRange(errors);
        return this;
    }

    #endregion
}

/// <summary>
/// Represents a field-specific validation error
/// </summary>
public class ValidationError
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
