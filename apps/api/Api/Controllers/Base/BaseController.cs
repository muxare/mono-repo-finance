using Api.Models.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Api.Controllers.Base;

/// <summary>
/// Base controller providing standardized error response helpers
/// </summary>
[ApiController]
public abstract class BaseController : ControllerBase
{
    protected readonly ILogger _logger;
    
    /// <summary>
    /// Gets the current request's trace identifier
    /// </summary>
    protected string TraceId => HttpContext.TraceIdentifier;

    protected BaseController(ILogger logger)
    {
        _logger = logger;
    }

    #region Error Response Helpers

    /// <summary>
    /// Returns a 400 Bad Request with standardized error response
    /// </summary>
    protected ActionResult BadRequestError(string message, string? details = null)
        => BadRequest(ApiErrorResponse.BadRequest(message, details, TraceId));

    /// <summary>
    /// Returns a 401 Unauthorized with standardized error response
    /// </summary>
    protected ActionResult UnauthorizedError(string message = "Unauthorized access", string? details = null)
        => Unauthorized(ApiErrorResponse.Unauthorized(message, details, TraceId));    /// <summary>
    /// Returns a 403 Forbidden with standardized error response
    /// </summary>
    protected ActionResult ForbiddenError(string message = "Access forbidden", string? details = null)
        => StatusCode(403, ApiErrorResponse.Forbidden(message, details, TraceId));

    /// <summary>
    /// Returns a 404 Not Found with standardized error response
    /// </summary>
    protected ActionResult NotFoundError(string message = "Resource not found", string? details = null)
        => NotFound(ApiErrorResponse.NotFound(message, details, TraceId));

    /// <summary>
    /// Returns a 404 Not Found for a specific resource type and identifier
    /// </summary>
    protected ActionResult ResourceNotFoundError(string resourceType, string identifier)
        => NotFound(ApiErrorResponse.ResourceNotFound(resourceType, identifier, TraceId));

    /// <summary>
    /// Returns a 409 Conflict with standardized error response
    /// </summary>
    protected ActionResult ConflictError(string message, string? details = null)
        => Conflict(ApiErrorResponse.Conflict(message, details, TraceId));

    /// <summary>
    /// Returns a 409 Conflict for a resource that already exists
    /// </summary>
    protected ActionResult ResourceConflictError(string resourceType, string identifier)
        => Conflict(ApiErrorResponse.ResourceAlreadyExists(resourceType, identifier, TraceId));    /// <summary>
    /// Returns a 422 Unprocessable Entity for business rule violations
    /// </summary>
    protected ActionResult BusinessRuleError(string rule, string message, string? details = null)
        => UnprocessableEntity(ApiErrorResponse.BusinessRuleFailed(rule, message, details, TraceId));

    /// <summary>
    /// Returns a 400 Bad Request for validation failures from ModelState
    /// </summary>
    protected ActionResult ValidationError(ModelStateDictionary modelState)
        => BadRequest(ApiErrorResponse.ValidationFailed(modelState, TraceId));

    /// <summary>
    /// Returns a 400 Bad Request for validation failures
    /// </summary>
    protected ActionResult ValidationError(List<ValidationError> errors)
        => BadRequest(ApiErrorResponse.ValidationFailed(errors, TraceId));

    /// <summary>
    /// Returns a 400 Bad Request for validation failures
    /// </summary>
    protected ActionResult ValidationError(string message = "Validation failed")
        => BadRequest(ApiErrorResponse.ValidationFailed(message, TraceId));

    /// <summary>
    /// Returns a 400 Bad Request for invalid parameters
    /// </summary>
    protected ActionResult InvalidParameterError(string parameterName, string reason)
        => BadRequest(ApiErrorResponse.InvalidParameter(parameterName, reason, TraceId));

    /// <summary>
    /// Returns a 400 Bad Request for missing required parameters
    /// </summary>
    protected ActionResult RequiredParameterError(string parameterName)
        => BadRequest(ApiErrorResponse.RequiredParameterMissing(parameterName, TraceId));    /// <summary>
    /// Returns a 500 Internal Server Error with standardized error response
    /// </summary>
    protected ActionResult InternalServerError(string message = "An internal server error occurred", string? details = null)
        => StatusCode(500, ApiErrorResponse.InternalServerError(message, details, TraceId));

    #endregion

    #region Exception Handling
    
    /// <summary>
    /// Handles exceptions and returns appropriate error responses
    /// </summary>
    protected ActionResult HandleException(Exception exception, string? customMessage = null)
    {
        _logger.LogError(exception, "Controller exception: {Message}", exception.Message);
        
        var errorResponse = customMessage != null 
            ? ApiErrorResponse.InternalServerError(customMessage, exception.Message, TraceId)
            : ApiErrorResponse.FromException(exception, TraceId);

        return StatusCode(errorResponse.StatusCode, errorResponse);
    }

    /// <summary>
    /// Handles exceptions with custom logging context
    /// </summary>
    protected ActionResult HandleException(Exception exception, string logMessage, params object[] logArgs)
    {
        _logger.LogError(exception, logMessage, logArgs);
        
        var errorResponse = ApiErrorResponse.FromException(exception, TraceId);
        return StatusCode(errorResponse.StatusCode, errorResponse);
    }

    #endregion

    #region Parameter Validation Helpers

    /// <summary>
    /// Validates that a string parameter is not null or whitespace
    /// </summary>
    protected ActionResult? ValidateRequiredString(string? value, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return RequiredParameterError(parameterName);
        }
        return null;
    }

    /// <summary>
    /// Validates that a parameter is not null
    /// </summary>
    protected ActionResult? ValidateRequired<T>(T? value, string parameterName) where T : class
    {
        if (value == null)
        {
            return RequiredParameterError(parameterName);
        }
        return null;
    }

    /// <summary>
    /// Validates date range parameters
    /// </summary>
    protected ActionResult? ValidateDateRange(DateTime? from, DateTime? to, string fromParameterName = "from", string toParameterName = "to")
    {
        if (from.HasValue && to.HasValue && from > to)
        {
            return InvalidParameterError(fromParameterName, $"{fromParameterName} date cannot be later than {toParameterName} date");
        }
        return null;
    }

    /// <summary>
    /// Validates that a numeric parameter is within a specified range
    /// </summary>
    protected ActionResult? ValidateRange(int value, int min, int max, string parameterName)
    {
        if (value < min || value > max)
        {
            return InvalidParameterError(parameterName, $"Value must be between {min} and {max}");
        }
        return null;
    }

    /// <summary>
    /// Validates that a numeric parameter is positive
    /// </summary>
    protected ActionResult? ValidatePositive(decimal value, string parameterName)
    {
        if (value <= 0)
        {
            return InvalidParameterError(parameterName, "Value must be greater than zero");
        }
        return null;
    }

    #endregion
}
