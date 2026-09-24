import {
  Product,
  ProductSchema,
  ProductRevision,
  ProductRevisionSchema,
} from "./products/product.schema";
import { ProductsService } from "./products/products.service";
import { Menu, MenuSchema } from "./schemas/menu.schema";
import { ProductsController } from "./products/products.controller";
import { MenusController } from "./menus.controller";
import { MenuManagementService } from "./menu-management.service";
import { Ingredient, IngredientSchema } from "./schemas/ingredient.schema";
import { IngredientsService } from "./ingredients.service";
import { IngredientsController } from "./ingredients.controller";
import { Provider, ProviderSchema } from "../providers/schemas/provider.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import {
  Category,
  CategorySchema,
  MenuItem,
  MenuItemSchema,
  MenuVersion,
  MenuVersionSchema,
} from "./schemas/menu.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductRevision.name, schema: ProductRevisionSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: MenuVersion.name, schema: MenuVersionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  controllers: [
    CatalogController,
    IngredientsController,
    ProductsController,
    MenusController,
  ],
  providers: [
    CatalogService,
    IngredientsService,
    ProductsService,
    MenuManagementService,
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
