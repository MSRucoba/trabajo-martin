import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const PUBLIC_URL = (process.env.PUBLIC_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const storage = async (
  file: Express.Multer.File,
  pathImage: string,
): Promise<string> => {
  if (!pathImage) {
    throw new Error('La ruta de la imagen (pathImage) es requerida.');
  }

  const safePath = pathImage.replace(/[^a-zA-Z0-9_\-/.]/g, '_');
  const fileName = `${Date.now()}_${uuidv4()}_${safePath}`;
  const targetDir = path.join(UPLOAD_DIR, 'images');
  const filePath = path.join(targetDir, fileName);

  ensureDir(targetDir);
  fs.writeFileSync(filePath, file.buffer);

  const relativeUrl = `/uploads/images/${fileName}`;
  console.log('URL de almacenamiento local:', relativeUrl);
  return `${PUBLIC_URL}${relativeUrl}`;
};

export const deleteFile = async (url: string): Promise<void> => {
  try {
    const relativePath = url.replace(`${PUBLIC_URL}/uploads/`, '');
    if (!relativePath || relativePath.includes('..')) return;

    const filePath = path.join(UPLOAD_DIR, relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Archivo eliminado: ${filePath}`);
    }
  } catch (error) {
    console.error('⚠️ Error al eliminar archivo local:', error);
  }
};
