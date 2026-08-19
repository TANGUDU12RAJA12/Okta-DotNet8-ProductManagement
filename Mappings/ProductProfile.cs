using AutoMapper;
using ProducutManagement.DTOs;
using ProducutManagement.Models;

namespace ProducutManagement.Mappings
{
    public class ProductProfile : Profile
    {
        public ProductProfile()
        {
            // Map Entity to Response DTO
            CreateMap<Product, ProductDto>();

            // Map Request DTOs to Entity
            CreateMap<CreateProductDto, Product>();
            CreateMap<UpdateProductDto, Product>();
        }
    }
}
