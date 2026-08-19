using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LeadGrowth.Models;
using Microsoft.IdentityModel.Tokens;

namespace LeadGrowth.Security;

public interface IJwtService
{
    string GenerateToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var jwtSecret = _configuration["Jwt:Secret"] 
            ?? "9a72e811c7d242637a28e3b1c6d3f2349e52c87123d4c67ba567c823ef567df1";
        var expirationMsRaw = _configuration["Jwt:ExpirationMs"] ?? "86400000";
        if (!double.TryParse(expirationMsRaw, out var expirationMs))
        {
            expirationMs = 86400000;
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("fullName", user.FullName)
        };

        if (user.WorkspaceId.HasValue)
        {
            claims.Add(new Claim("workspaceId", user.WorkspaceId.Value.ToString()));
        }

        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.Name));
        }

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMilliseconds(expirationMs),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var jwtSecret = _configuration["Jwt:Secret"] 
            ?? "9a72e811c7d242637a28e3b1c6d3f2349e52c87123d4c67ba567c823ef567df1";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
