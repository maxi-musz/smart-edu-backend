import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('')
  async getAllPublicProductsSections() {
    return this.productsService.getAllPublicProductsSections();
  }

  @Get('browse')
  async getPaginatedProducts(@Query('page') page: string) {
    const pageNumber = parseInt(page, 10) || 1;
    return this.productsService.getPaginatedProducts(pageNumber);
  }

  @Get(':id')
    async getProductById(@Param('id') id: string) {
        return this.productsService.getProductById(id);
    }
}
