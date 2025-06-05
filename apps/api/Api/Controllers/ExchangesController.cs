using Api.Models.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// API controller for exchange operations
/// </summary>
[ApiController]
[Route("api/exchanges")]
[Produces("application/json")]
public class ExchangesController : ControllerBase
{
    private readonly IExchangeService _exchangeService;
    private readonly ILogger<ExchangesController> _logger;

    public ExchangesController(IExchangeService exchangeService, ILogger<ExchangesController> logger)
    {
        _exchangeService = exchangeService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all available exchanges with stock counts
    /// </summary>
    /// <returns>List of exchanges</returns>
    /// <response code="200">Returns the list of exchanges</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ExchangeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<ExchangeDto>>> GetExchanges()
    {
        try
        {
            var exchanges = await _exchangeService.GetExchangesAsync();
            return Ok(exchanges);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching exchanges");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Retrieves all stocks traded on a specific exchange
    /// </summary>
    /// <param name="id">The exchange ID</param>
    /// <returns>List of stocks on the exchange</returns>
    /// <response code="200">Returns the list of stocks</response>
    /// <response code="404">If the exchange is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet("{id}/stocks")]
    [ProducesResponseType(typeof(IEnumerable<StockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<StockDto>>> GetStocksByExchange(int id)
    {
        try
        {
            var stocks = await _exchangeService.GetStocksByExchangeAsync(id);
            
            if (!stocks.Any())
            {
                return NotFound($"No stocks found for exchange with ID {id}");
            }

            return Ok(stocks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stocks for exchange: {ExchangeId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }
}
