using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProducutManagement.DTOs;
using ProducutManagement.Repositories;
using ProducutManagement.Services;

namespace ProducutManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(IUserRepository userRepository, IJwtTokenService jwtTokenService)
        {
            _userRepository = userRepository;
            _jwtTokenService = jwtTokenService;
        }

        // POST: api/auth/register (Allow Anonymous so new unregistered users can sign up)
        [AllowAnonymous]
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (_userRepository.UserExists(registerDto.Username))
            {
                return BadRequest(new { message = $"Username '{registerDto.Username}' is already taken." });
            }

            // Hash password using BCrypt.Net-Next
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            var success = _userRepository.RegisterUser(registerDto.Username, passwordHash);
            if (!success)
            {
                return BadRequest(new { message = "Registration failed. Please try again." });
            }

            return Ok(new { message = "Registration successful! You can now log in." });
        }

        // POST: api/auth/login (Allow Anonymous so public users can log in)
        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var passwordHash = _userRepository.GetPasswordHash(loginDto.Username);
            if (passwordHash == null)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            // Verify password using BCrypt
            var isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, passwordHash);
            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            // Generate JWT Token
            var token = _jwtTokenService.GenerateToken(loginDto.Username);

            return Ok(new AuthResponseDto
            {
                Token = token,
                Username = loginDto.Username
            });
        }
    }
}
