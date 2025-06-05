using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

/// <summary>
/// SignalR hub for real-time import progress updates
/// </summary>
public class ImportProgressHub : Hub
{
    public async Task JoinImportGroup(string importId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"import_{importId}");
    }

    public async Task LeaveImportGroup(string importId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"import_{importId}");
    }
}
