using Microsoft.AspNetCore.Mvc;
using Api.Models;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodosController : ControllerBase
{
    private static readonly List<Todo> Todos = new()
    {
        new() { Id = 1, Title = "Learn .NET", Description = "Learn .NET Core development", IsCompleted = false },
        new() { Id = 2, Title = "Learn React", Description = "Learn React with TypeScript", IsCompleted = false },
        new() { Id = 3, Title = "Setup Monorepo", Description = "Setup a monorepo with Nx", IsCompleted = true, CompletedAt = DateTime.UtcNow.AddHours(-2) }
    };

    [HttpGet]
    public ActionResult<IEnumerable<Todo>> GetTodos()
    {
        return Ok(Todos);
    }

    [HttpGet("{id}")]
    public ActionResult<Todo> GetTodo(int id)
    {
        var todo = Todos.FirstOrDefault(t => t.Id == id);
        if (todo == null)
        {
            return NotFound();
        }
        return Ok(todo);
    }

    [HttpPost]
    public ActionResult<Todo> CreateTodo([FromBody] CreateTodoRequest request)
    {
        var todo = new Todo
        {
            Id = Todos.Max(t => t.Id) + 1,
            Title = request.Title,
            Description = request.Description,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        Todos.Add(todo);
        return CreatedAtAction(nameof(GetTodo), new { id = todo.Id }, todo);
    }

    [HttpPut("{id}")]
    public ActionResult<Todo> UpdateTodo(int id, [FromBody] UpdateTodoRequest request)
    {
        var todo = Todos.FirstOrDefault(t => t.Id == id);
        if (todo == null)
        {
            return NotFound();
        }

        todo.Title = request.Title;
        todo.Description = request.Description;
        todo.IsCompleted = request.IsCompleted;
        
        if (request.IsCompleted && !todo.IsCompleted)
        {
            todo.CompletedAt = DateTime.UtcNow;
        }
        else if (!request.IsCompleted && todo.IsCompleted)
        {
            todo.CompletedAt = null;
        }

        return Ok(todo);
    }

    [HttpDelete("{id}")]
    public ActionResult DeleteTodo(int id)
    {
        var todo = Todos.FirstOrDefault(t => t.Id == id);
        if (todo == null)
        {
            return NotFound();
        }

        Todos.Remove(todo);
        return NoContent();
    }
}

public class CreateTodoRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class UpdateTodoRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
}
