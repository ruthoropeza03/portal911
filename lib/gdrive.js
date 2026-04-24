import { google } from 'googleapis';
import { Readable } from 'stream';


export const getDriveService = () => {
  const {
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN,
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY
  } = process.env;

  // Prioridad 1: OAuth2 (Usa la cuota del usuario real, evita error 403 de Service Account)
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob'
      );
      oauth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });
      return google.drive({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      console.error('Error inicializando OAuth2 de Drive:', error.message);
    }
  }

  // Prioridad 2: Service Account (Ideal para lectura, pero tiene 0 quota de subida propia)
  if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
    try {
      const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      const auth = new google.auth.GoogleAuth({
        credentials: { client_email: GOOGLE_CLIENT_EMAIL, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      return google.drive({ version: 'v3', auth });
    } catch (error) {
      console.error('Error inicializando Service Account de Drive:', error.message);
    }
  }

  console.error('Faltan todas las credenciales de Google Drive en .env.local');
  return null;
};



/**
 * Sube un archivo a una carpeta específica de Google Drive.
 * @param {Buffer}  buffer    - Contenido del archivo
 * @param {string}  filename  - Nombre del archivo
 * @param {string}  mimeType  - MIME type del archivo
 * @param {string}  folderId  - ID de la carpeta destino en Drive
 * @returns {string} ID del archivo creado en Drive
 */
export const uploadFileToDrive = async (buffer, filename, mimeType, folderId) => {
  const drive = getDriveService();

  if (!drive) {
    return `fake-drive-id-${Date.now()}`;
  }

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  try {
    const response = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: filename,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    return response.data.id;
  } catch (error) {
    if (error.response) {
      console.error('Error API Google Drive (Upload):', error.response.status, error.response.data);
    } else {
      console.error(' Error subiendo archivo a Google Drive:', error.message);
    }
    throw new Error(`Error en Drive: ${error.message}`);
  }
};

/**
 * Obtiene el stream de descarga de un archivo de Drive.
 * @param {string} fileId - ID del archivo en Drive
 * @returns {object} { stream, mimeType, filename }
 */
export const getFileFromDrive = async (fileId) => {
  const drive = getDriveService();
  if (!drive) throw new Error('Servicio de Drive no disponible');

  try {
    const meta = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: 'name, mimeType',
    });

    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    return {
      stream: res.data,
      mimeType: meta.data.mimeType,
      filename: meta.data.name,
    };
  } catch (error) {
    if (error.response) {
      console.error(' Error API Google Drive (Download):', error.response.status, error.response.data);
    } else {
      console.error(' Error obteniendo archivo de Drive:', error.message);
    }
    throw new Error(`Error al leer de Drive: ${error.message}`);
  }
};

/**
 * Elimina un archivo de Google Drive.
 * @param {string} fileId - ID del archivo en Drive
 */
export const deleteFileFromDrive = async (fileId) => {
  const drive = getDriveService();
  if (!drive) return;

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (error) {
    console.error('Error eliminando archivo de Drive:', error.message);
  }
};
