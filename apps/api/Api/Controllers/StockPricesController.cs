using Api.Controllers.Base;
using Api.Models.DTOs;
using Api.Models.Responses;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// API controller for stock price operations
/// </summary>
[ApiController]
[Route("api/stocks/{symbol}/prices")]
[Produces("application/json")]
public class StockPricesController : ControllerBase
{
    private readonly IStockPriceService _stockPriceService;
    private readonly ILogger<StockPricesController> _logger;

    public StockPricesController(IStockPriceService stockPriceService, ILogger<StockPricesController> logger)
    {
        _stockPriceService = stockPriceService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves historical price data for a specific stock
    /// </summary>
    /// <param name="symbol">The stock symbol (e.g., AAPL, GOOGL)</param>
    /// <param name="request">Price range and filtering parameters</param>
    /// <returns>Historical price data</returns>
    /// <response code="200">Returns the historical price data</response>
    /// <response code="400">If the parameters are invalid</response>
    /// <response code="404">If the stock is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<StockPriceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<StockPriceDto>>> GetStockPrices(
        string symbol, 
        [FromQuery] PriceRangeRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Stock symbol is required");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate date range
            if (request.From.HasValue && request.To.HasValue && request.From > request.To)
            {
                return BadRequest("From date cannot be later than To date");
            }

            var prices = await _stockPriceService.GetStockPricesAsync(symbol, request);
            
            if (!prices.Any())
            {
                return NotFound($"No price data found for stock symbol '{symbol}'");
            }

            return Ok(prices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stock prices for symbol: {Symbol}", symbol);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Retrieves the latest price data for a specific stock
    /// </summary>
    /// <param name="symbol">The stock symbol (e.g., AAPL, GOOGL)</param>
    /// <returns>Latest price data</returns>
    /// <response code="200">Returns the latest price data</response>
    /// <response code="404">If the stock or price data is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet("latest")]
    [ProducesResponseType(typeof(StockPriceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StockPriceDto>> GetLatestStockPrice(string symbol)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Stock symbol is required");
            }

            var latestPrice = await _stockPriceService.GetLatestStockPriceAsync(symbol);
            
            if (latestPrice == null)
            {
                return NotFound($"No price data found for stock symbol '{symbol}'");
            }

            return Ok(latestPrice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching latest stock price for symbol: {Symbol}", symbol);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }    /// <summary>
    /// Retrieves OHLC (Open, High, Low, Close) data for a specific stock
    /// </summary>
    /// <param name="symbol">The stock symbol (e.g., AAPL, GOOGL)</param>
    /// <param name="period">Time period for OHLC data (e.g., ALL, 10Y, 5Y, 2Y, 1Y, 6M, 3M, 1M, 1W, 1D)</param>
    /// <returns>OHLC data</returns>
    /// <response code="200">Returns the OHLC data</response>
    /// <response code="400">If the parameters are invalid</response>
    /// <response code="404">If the stock is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet("ohlc")]
    [ProducesResponseType(typeof(IEnumerable<OhlcDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<OhlcDto>>> GetOhlcData(
        string symbol, 
        [FromQuery] string period = "ALL")
    {
        try
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Stock symbol is required");
            }

            // Parse period to determine date range
            var (from, to) = ParsePeriod(period);
            
            var request = new PriceRangeRequest
            {
                From = from,
                To = to,
                Limit = 1000
            };

            var prices = await _stockPriceService.GetStockPricesAsync(symbol, request);
              if (!prices.Any())
            {
                return NotFound($"No price data found for stock symbol '{symbol}'");
            }
            
            var ohlcData = prices.Select(p => new OhlcDto
            {
                Date = p.Date,
                Open = p.Open,
                High = p.High,
                Low = p.Low,
                Close = p.Close,
                Volume = p.Volume
            });
            
            return Ok(ohlcData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching OHLC data for symbol: {Symbol}", symbol);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Creates a new stock price entry
    /// </summary>
    /// <param name="symbol">The stock symbol</param>
    /// <param name="createStockPriceDto">Stock price data</param>
    /// <returns>Created stock price</returns>
    /// <response code="201">Returns the created stock price</response>
    /// <response code="400">If the request data is invalid</response>
    /// <response code="409">If price data already exists for the date</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpPost]
    [ProducesResponseType(typeof(StockPriceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StockPriceDto>> CreateStockPrice(
        string symbol, 
        [FromBody] CreateStockPriceDto createStockPriceDto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest(new ErrorResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    Title = "Bad Request",
                    Status = 400,
                    Detail = "Stock symbol is required",
                    Instance = Request.Path,
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Ensure the symbol in the URL matches the DTO
            createStockPriceDto.Symbol = symbol;

            var stockPrice = await _stockPriceService.CreateStockPriceAsync(createStockPriceDto);
            return CreatedAtAction(nameof(GetLatestStockPrice), new { symbol }, stockPrice);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while creating stock price for symbol: {Symbol}", symbol);
            return BadRequest(new ErrorResponse
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = "Bad Request",
                Status = 400,
                Detail = ex.Message,
                Instance = Request.Path,
                TraceId = HttpContext.TraceIdentifier
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Conflict occurred while creating stock price for symbol: {Symbol}", symbol);
            return Conflict(new ErrorResponse
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
                Title = "Conflict",
                Status = 409,
                Detail = ex.Message,
                Instance = Request.Path,
                TraceId = HttpContext.TraceIdentifier
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating stock price for symbol: {Symbol}", symbol);
            return StatusCode(500, new ErrorResponse
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Title = "Internal Server Error",
                Status = 500,
                Detail = "An error occurred while processing your request",
                Instance = Request.Path,
                TraceId = HttpContext.TraceIdentifier
            });
        }
    }

    /// <summary>
    /// Creates multiple stock price entries in bulk
    /// </summary>
    /// <param name="symbol">The stock symbol</param>
    /// <param name="createStockPriceDtos">Array of stock price data</param>
    /// <returns>Created stock prices</returns>
    /// <response code="201">Returns the created stock prices</response>
    /// <response code="400">If the request data is invalid</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(IEnumerable<StockPriceDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<StockPriceDto>>> CreateBulkStockPrices(
        string symbol,
        [FromBody] IEnumerable<CreateStockPriceDto> createStockPriceDtos)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest(new ErrorResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    Title = "Bad Request",
                    Status = 400,
                    Detail = "Stock symbol is required",
                    Instance = Request.Path,
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var pricesDto = createStockPriceDtos.ToList();
            if (!pricesDto.Any())
            {
                return BadRequest(new ErrorResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    Title = "Bad Request",
                    Status = 400,
                    Detail = "At least one price entry is required",
                    Instance = Request.Path,
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            // Ensure all DTOs have the correct symbol
            foreach (var dto in pricesDto)
            {
                dto.Symbol = symbol;
            }

            var stockPrices = await _stockPriceService.CreateBulkStockPricesAsync(pricesDto);
            return CreatedAtAction(nameof(GetStockPrices), new { symbol }, stockPrices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating bulk stock prices for symbol: {Symbol}", symbol);
            return StatusCode(500, new ErrorResponse
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Title = "Internal Server Error",
                Status = 500,
                Detail = "An error occurred while processing your request",
                Instance = Request.Path,
                TraceId = HttpContext.TraceIdentifier
            });
        }
    }

    /// <summary>
    /// Deletes stock price data for a symbol within a date range
    /// </summary>
    /// <param name="symbol">The stock symbol</param>
    /// <param name="fromDate">Start date (optional)</param>
    /// <param name="toDate">End date (optional)</param>
    /// <returns>Success status</returns>
    /// <response code="204">Price data deleted successfully</response>
    /// <response code="404">If the stock is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteStockPrices(
        string symbol,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest(new ErrorResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    Title = "Bad Request",
                    Status = 400,
                    Detail = "Stock symbol is required",
                    Instance = Request.Path,
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            var deleted = await _stockPriceService.DeleteStockPricesAsync(symbol, fromDate, toDate);
            
            if (!deleted)
            {
                return NotFound(new ErrorResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                    Title = "Not Found",
                    Status = 404,
                    Detail = $"Stock with symbol '{symbol}' not found",
                    Instance = Request.Path,
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting stock prices for symbol: {Symbol}", symbol);
            return StatusCode(500, new ErrorResponse
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Title = "Internal Server Error",
                Status = 500,
                Detail = "An error occurred while processing your request",
                Instance = Request.Path,
                TraceId = HttpContext.TraceIdentifier
            });
        }
    }    private static (DateTime from, DateTime to) ParsePeriod(string period)
    {
        var to = DateTime.UtcNow.Date;
        var from = period.ToUpper() switch
        {
            "1D" => to.AddDays(-1),
            "1W" => to.AddDays(-7),
            "1M" => to.AddMonths(-1),
            "3M" => to.AddMonths(-3),
            "6M" => to.AddMonths(-6),
            "1Y" => to.AddYears(-1),
            "2Y" => to.AddYears(-2),
            "5Y" => to.AddYears(-5),
            "10Y" => to.AddYears(-10),
            "ALL" => new DateTime(1990, 1, 1), // Return all available data from 1990 onwards
            _ => new DateTime(1990, 1, 1) // Default to ALL for maximum compatibility
        };
        
        return (from, to);
    }
}
