import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { MenuManagementService } from "../catalog/menu-management.service";
import { SchedulerRegistry } from "@nestjs/schedule";
/** Run with writes paused and a backup; repeat safely after an interrupted run. */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    for (const job of app.get(SchedulerRegistry).getCronJobs().values())
      await job.stop();
    console.log(
      JSON.stringify(await app.get(MenuManagementService).migrateLegacy()),
    );
  } finally {
    await app.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
