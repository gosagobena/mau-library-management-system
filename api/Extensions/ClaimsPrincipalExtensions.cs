using System.Security.Claims;

namespace LibrarySystem.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub")
                  ?? throw new InvalidOperationException("Token is missing the user id claim.");
        return Guid.Parse(sub);
    }

    public static bool IsStaff(this ClaimsPrincipal user) =>
        user.IsInRole("Librarian") || user.IsInRole("Administrator");
}
