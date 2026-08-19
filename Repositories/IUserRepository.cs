namespace ProducutManagement.Repositories
{
    public interface IUserRepository
    {
        bool UserExists(string username);
        bool RegisterUser(string username, string passwordHash);
        string? GetPasswordHash(string username);
    }
}
