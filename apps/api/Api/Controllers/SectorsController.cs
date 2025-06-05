using Api.Models.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// API controller for sector operations
/// </summary>
[ApiController]
[Route("api/sectors")]
[Produces("application/json")]
public class SectorsController : ControllerBase
{
    private readonly ISectorService _sectorService;
    private readonly ILogger<SectorsController> _logger;

    public SectorsController(ISectorService sectorService, ILogger<SectorsController> logger)
    {
        _sectorService = sectorService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all available sectors with stock counts
    /// </summary>
    /// <returns>List of sectors</returns>
    /// <response code="200">Returns the list of sectors</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SectorDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<SectorDto>>> GetSectors()
    {
        try
        {
            var sectors = await _sectorService.GetSectorsAsync();
            return Ok(sectors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching sectors");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    /// <summary>
    /// Retrieves all stocks in a specific sector
    /// </summary>
    /// <param name="id">The sector ID</param>
    /// <returns>List of stocks in the sector</returns>
    /// <response code="200">Returns the list of stocks</response>
    /// <response code="404">If the sector is not found</response>
    /// <response code="500">If an internal server error occurs</response>
    [HttpGet("{id}/stocks")]
    [ProducesResponseType(typeof(IEnumerable<StockDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<StockDto>>> GetStocksBySector(int id)
    {
        try
        {
            var stocks = await _sectorService.GetStocksBySectorAsync(id);
            
            if (!stocks.Any())
            {
                return NotFound($"No stocks found for sector with ID {id}");
            }

            return Ok(stocks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while fetching stocks for sector: {SectorId}", id);
            return StatusCode(500, "An error occurred while processing your request");
        }
    }
}
