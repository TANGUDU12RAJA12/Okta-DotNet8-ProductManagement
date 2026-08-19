namespace ProducutManagement.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(string username);
    }
}
