using Api.Models.DTOs;
using Api.Services;
using Api.Controllers.Base;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// API controller for stock operations
/// </summary>
[ApiController]
[Route("api/stocks")]
[Produces("application/json")]
public class StocksController : BaseController
{
    private readonly IStockService _stockService;

    public StocksController(IStockService stockService, ILogger<StocksController> logger) : base(logger)
    {
        _stockService = stockService;
    }/// <summary>
    /// Retrieves a paginated list of stocks with optional filtering and sorting
    /// </summary>
    /// <param name="parameters">Query parameters for filtering, sorting, and pagination</param>
    /// <returns>Paginated list of stocks</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     GET /api/stocks?page=1&amp;pageSize=10&amp;search=apple&amp;sector=Technology&amp;sortBy=marketCap&amp;sortOrder=desc
    /// 
    /// </remarks>
    /// <response code="200">Returns the paginated list of stocks</response>
    /// <response code="400">If the query parameters are invalid</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet]    [ProducesResponseType(typeof(PagedResult<StockSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PagedResult<StockSummaryDto>>> GetStocks([FromQuery] StockQueryParameters parameters)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _stockService.GetStocksAsync(parameters);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stocks");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }    /// <summary>
    /// Retrieves detailed information for a specific stock by symbol
    /// </summary>
    /// <param name="symbol">The stock symbol (e.g., AAPL, GOOGL)</param>
    /// <returns>Stock details</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     GET /api/stocks/AAPL
    /// 
    /// </remarks>
    /// <response code="200">Returns the stock details</response>
    /// <response code="404">If the stock is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet("{symbol}")]    [ProducesResponseType(typeof(StockDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StockDto>> GetStockBySymbol(string symbol)
    {
        try        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequestError("Stock symbol is required");
            }

            var stock = await _stockService.GetStockBySymbolAsync(symbol);
            
            if (stock == null)
            {
                return NotFoundError($"Stock with symbol '{symbol}' not found");
            }

            return Ok(stock);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stock by symbol: {Symbol}", symbol);
            return InternalServerError("An error occurred while processing your request", ex.Message);
        }
    }

    /// <summary>
    /// Creates a new stock
    /// </summary>
    /// <param name="createStockDto">Stock creation data</param>
    /// <returns>Created stock details</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     POST /api/stocks
    ///     {
    ///         "symbol": "MSFT",
    ///         "name": "Microsoft Corporation",
    ///         "marketCap": 2800000000000,
    ///         "description": "Technology company",
    ///         "outstandingShares": 7430000000,
    ///         "isActive": true,
    ///         "sectorId": 1,
    ///         "exchangeId": 1
    ///     }
    /// 
    /// </remarks>
    /// <response code="201">Returns the created stock</response>
    /// <response code="400">If the request data is invalid</response>
    /// <response code="409">If a stock with the same symbol already exists</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpPost]
    [ProducesResponseType(typeof(StockDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StockDto>> CreateStock([FromBody] CreateStockDto createStockDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var stock = await _stockService.CreateStockAsync(createStockDto);
            return CreatedAtAction(nameof(GetStockBySymbol), new { symbol = stock.Symbol }, stock);
        }        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Conflict occurred while creating stock: {Symbol}", createStockDto.Symbol);
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
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while creating stock: {Symbol}", createStockDto.Symbol);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while creating stock: {Symbol}", createStockDto.Symbol);
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
    /// Updates an existing stock
    /// </summary>
    /// <param name="symbol">The stock symbol to update</param>
    /// <param name="updateStockDto">Stock update data</param>
    /// <returns>Updated stock details</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     PUT /api/stocks/MSFT
    ///     {
    ///         "name": "Microsoft Corporation Updated",
    ///         "marketCap": 2900000000000,
    ///         "isActive": true
    ///     }
    /// 
    /// </remarks>
    /// <response code="200">Returns the updated stock</response>
    /// <response code="400">If the request data is invalid</response>
    /// <response code="404">If the stock is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpPut("{symbol}")]
    [ProducesResponseType(typeof(StockDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<StockDto>> UpdateStock(string symbol, [FromBody] UpdateStockDto updateStockDto)
    {
        try
        {            if (string.IsNullOrWhiteSpace(symbol))
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

            var stock = await _stockService.UpdateStockAsync(symbol, updateStockDto);
            
            if (stock == null)
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

            return Ok(stock);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while updating stock: {Symbol}", symbol);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating stock: {Symbol}", symbol);
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
    /// Deletes a stock (soft delete if has price data, hard delete otherwise)
    /// </summary>
    /// <param name="symbol">The stock symbol to delete</param>
    /// <returns>Success status</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     DELETE /api/stocks/MSFT
    /// 
    /// </remarks>
    /// <response code="204">Stock deleted successfully</response>
    /// <response code="404">If the stock is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpDelete("{symbol}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteStock(string symbol)
    {
        try
        {            if (string.IsNullOrWhiteSpace(symbol))
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

            var deleted = await _stockService.DeleteStockAsync(symbol);
            
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
            _logger.LogError(ex, "Error occurred while deleting stock: {Symbol}", symbol);
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
}
