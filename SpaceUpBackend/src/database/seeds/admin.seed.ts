import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../usuario/usuario.entity';
import { UserRole } from '../../usuario/user-role.enum';

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'spaceup_user',
    password: process.env.DB_PASS || 'spaceup_password',
    database: process.env.DB_NAME || 'spaceup_db',
    entities: [Usuario],
    synchronize: false,
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(Usuario);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@spaceup.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const existing = await userRepo.findOne({ where: { email: adminEmail } });

  if (existing) {
    console.log(`⚡ El usuario admin ${adminEmail} ya existe.`);
    await dataSource.destroy();
    return;
  }

  const admin = userRepo.create({
    email: adminEmail,
    nombre: 'Administrador',
    apellido: 'SpaceUp',
    dni: '00000000',
    phone: '999999999',
    password: await bcrypt.hash(adminPassword, 10),
    rol: UserRole.ADMIN,
  });

  await userRepo.save(admin);
  console.log(`✅ Usuario admin creado: ${adminEmail} / ${adminPassword}`);

  await dataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error('❌ Error creando admin:', err);
  process.exit(1);
});
