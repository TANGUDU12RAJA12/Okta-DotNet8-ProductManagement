using System.Collections.Concurrent;

namespace ProducutManagement.Repositories
{
    public class InMemoryUserRepository : IUserRepository
    {
        // Thread-safe dictionary storing Username (lowercase key) -> Hashed Password
        private readonly ConcurrentDictionary<string, string> _users = new(StringComparer.OrdinalIgnoreCase);

        public InMemoryUserRepository()
        {
            // Seed default admin user for instant testing
            // Username: admin, Password: Password123!
            var initialHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
            _users.TryAdd("admin", initialHash);
        }

        public bool UserExists(string username)
        {
            if (string.IsNullOrWhiteSpace(username)) return false;
            return _users.ContainsKey(username.Trim());
        }

        public bool RegisterUser(string username, string passwordHash)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(passwordHash))
            {
                return false;
            }

            return _users.TryAdd(username.Trim(), passwordHash);
        }

        public string? GetPasswordHash(string username)
        {
            if (string.IsNullOrWhiteSpace(username)) return null;

            _users.TryGetValue(username.Trim(), out var hash);
            return hash;
        }
    }
}
