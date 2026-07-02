import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'spaceup_user',
  password: process.env.DB_PASS || 'spaceup_password',
  database: process.env.DB_NAME || 'spaceup_db',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
