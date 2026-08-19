using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProducutManagement.DTOs;
using ProducutManagement.Models;
using ProducutManagement.Repositories;

namespace ProducutManagement.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public ProductsController(IProductRepository productRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }

        // GET: api/products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        {
            var products = await _productRepository.GetAllAsync();
            var productDtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            return Ok(productDtos);
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetById(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = $"Product with ID {id} not found." });
            }

            var productDto = _mapper.Map<ProductDto>(product);
            return Ok(productDto);
        }

        // POST: api/products
        [HttpPost]
        public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = _mapper.Map<Product>(createDto);
            var createdProduct = await _productRepository.CreateAsync(product);
            var resultDto = _mapper.Map<ProductDto>(createdProduct);

            return CreatedAtAction(nameof(GetById), new { id = resultDto.Id }, resultDto);
        }

        // PUT: api/products/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingProduct = await _productRepository.GetByIdAsync(id);
            if (existingProduct == null)
            {
                return NotFound(new { message = $"Product with ID {id} not found." });
            }

            // Map updated properties onto existing entity
            _mapper.Map(updateDto, existingProduct);

            var updated = await _productRepository.UpdateAsync(existingProduct);
            if (!updated)
            {
                return BadRequest(new { message = "Failed to update product." });
            }

            return NoContent();
        }

        // DELETE: api/products/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _productRepository.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = $"Product with ID {id} not found." });
            }

            return NoContent();
        }
    }
}
