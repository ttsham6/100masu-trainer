import * as typeorm from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const dataSources = new typeorm.DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const runMigration = async (): Promise<void> => {
  try {
    await dataSources.initialize();

    await dataSources.query(`
    create table if not exists score(
      id int primary key auto_increment,
      score_time float,
      created_at timestamp default current_timestamp,
      updated_at timestamp default current_timestamp on update current_timestamp
    );`);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  } finally {
    await dataSources.destroy();
  }
};

runMigration();
