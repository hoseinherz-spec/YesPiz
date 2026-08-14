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
      { name: MenuVersion.name, schema: MenuVersionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
