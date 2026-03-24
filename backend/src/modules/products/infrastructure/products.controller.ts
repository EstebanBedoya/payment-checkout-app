import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProduct: GetProductUseCase,
    private readonly getProducts: GetProductsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all products with stock' })
  async findAll() {
    const r = await this.getProducts.execute()
    if (r.isErr()) throw new HttpException(r.error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    return { data: r.value }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async findOne(@Param('id') id: string) {
    const r = await this.getProduct.execute({ productId: id })
    if (r.isErr()) throw new HttpException({ error: r.error.code, message: r.error.message }, HttpStatus.NOT_FOUND)
    return { data: r.value }
  }
}
