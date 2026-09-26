import {
  BadRequestException,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
  StreamableFile,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { IsIn, IsString, MaxLength } from "class-validator";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { Roles } from "./common/decorators/roles.decorator";
import { UserRole } from "./common/enums";
class ImageUploadDto {
  @IsIn(["image/jpeg", "image/png"]) contentType!: string;
  @IsString() @MaxLength(7_000_000) base64!: string;
}
@Controller("operations/lookups")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class AdminLookupController {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  @Get(":kind") async list(
    @Param("kind") kind: string,
    @Query("q") query = "",
    @Query("customerId") customerId?: string,
    @Query("selected") selected?: string,
  ) {
    if (
      typeof query !== "string" ||
      (customerId !== undefined && typeof customerId !== "string") ||
      (selected !== undefined && typeof selected !== "string")
    )
      throw new BadRequestException("Invalid lookup query.");
    const collections: Record<string, string> = {
      user: "users",
      customer: "users",
      courier: "users",
      provider: "providers",
      order: "orders",
      address: "addresses",
      ingredient: "ingredients",
    };
    const collection = collections[kind];
    if (!Object.prototype.hasOwnProperty.call(collections, kind))
      throw new BadRequestException("Unknown entity type.");
    const filter: Record<string, unknown> = {};
    if (kind === "courier") filter.roles = UserRole.COURIER;
    if (kind === "customer") filter.roles = UserRole.CUSTOMER;
    if (kind === "address") {
      if (!customerId || !/^[a-f\d]{24}$/i.test(customerId)) return [];
      const { Types } = await import("mongoose");
      filter.userId = new Types.ObjectId(customerId);
    }
    const fields =
      kind === "user" || kind === "customer" || kind === "courier"
        ? ["firstName", "lastName", "email", "phone"]
        : kind === "address"
          ? ["street", "city", "label"]
          : kind === "order"
            ? ["orderNumber", "status", "totalCents", "createdAt"]
            : ["name", "address"];
    const selectedFilter = { ...filter };
    if (query.trim())
      filter.$and = query
        .trim()
        .slice(0, 100)
        .split(/[\s·]+/)
        .filter(Boolean)
        .slice(0, 8)
        .map((term) => ({
          $or: fields.map((f) => ({
            [f]: {
              $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          })),
        }));
    const projection = Object.fromEntries(fields.map((f) => [f, 1]));
    const rows = await this.connection
      .collection(collection)
      .find(filter, { projection })
      .sort({ _id: -1 })
      .limit(100)
      .toArray();
    if (
      selected &&
      /^[a-f\d]{24}$/i.test(selected) &&
      !rows.some((r) => String(r._id) === selected)
    ) {
      const { Types } = await import("mongoose");
      const row = await this.connection
        .collection(collection)
        .findOne(
          { ...selectedFilter, _id: new Types.ObjectId(selected) },
          { projection },
        );
      if (row) rows.unshift(row);
    }
    return rows.map((r) => ({
      id: String(r._id),
      label:
        kind === "order"
          ? `Order #${String(r._id).slice(-8)} · ${r.status} · €${(Number(r.totalCents || 0) / 100).toFixed(2)}${r.createdAt ? ` · ${new Date(r.createdAt).toISOString().slice(0, 10)}` : ""}`
          : fields
              .map((f) => r[f])
              .filter(Boolean)
              .join(" · ") || `${kind} ${String(r._id).slice(-6)}`,
    }));
  }
}
@Controller("catalog/media")
class CatalogMediaController {
  constructor(private readonly config: ConfigService) {}
  private directory() {
    return (
      this.config.get<string>("MEDIA_LOCAL_DIR") ||
      join(process.cwd(), "uploads")
    );
  }
  private client() {
    return new S3Client({
      region: this.config.get("S3_REGION") || "eu-central-1",
      endpoint: this.config.get("S3_ENDPOINT") || undefined,
      forcePathStyle: this.config.get("S3_FORCE_PATH_STYLE") === "true",
      credentials: this.config.get("S3_ACCESS_KEY_ID")
        ? {
            accessKeyId: this.config.get("S3_ACCESS_KEY_ID")!,
            secretAccessKey: this.config.get("S3_SECRET_ACCESS_KEY")!,
          }
        : undefined,
    });
  }
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async upload(@Body() dto: ImageUploadDto) {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(dto.base64))
      throw new BadRequestException("Invalid image.");
    const bytes = Buffer.from(dto.base64, "base64");
    const valid =
      dto.contentType === "image/png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid || bytes.length > 5 * 1024 * 1024 || !bytes.length)
      throw new BadRequestException("Choose a JPEG or PNG image up to 5 MB.");
    const key = `catalog-${randomUUID()}.${dto.contentType === "image/png" ? "png" : "jpg"}`;
    const bucket = this.config.get<string>("S3_BUCKET");
    if (bucket)
      await this.client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `catalog/${key}`,
          Body: bytes,
          ContentType: dto.contentType,
        }),
      );
    else {
      if (this.config.get("NODE_ENV") === "production")
        throw new BadRequestException("Media storage is not configured.");
      await mkdir(this.directory(), { recursive: true });
      await writeFile(join(this.directory(), key), bytes, { flag: "wx" });
    }
    return { url: `/api/v1/catalog/media/${key}` };
  }
  @Get(":key") async read(@Param("key") key: string) {
    if (!/^catalog-[a-f\d-]{36}\.(png|jpg)$/.test(key))
      throw new NotFoundException();
    try {
      const bucket = this.config.get<string>("S3_BUCKET");
      const bytes = bucket
        ? Buffer.from(
            await (
              await this.client().send(
                new GetObjectCommand({ Bucket: bucket, Key: `catalog/${key}` }),
              )
            ).Body!.transformToByteArray(),
          )
        : await readFile(join(this.directory(), key));
      return new StreamableFile(bytes, {
        type: key.endsWith(".png") ? "image/png" : "image/jpeg",
      });
    } catch {
      throw new NotFoundException();
    }
  }
}
@Module({ controllers: [AdminLookupController, CatalogMediaController] })
export class AdminToolsModule {}
