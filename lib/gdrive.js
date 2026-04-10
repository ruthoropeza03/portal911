import { google } from 'googleapis';
import { Readable } from 'stream';

const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export const getDriveService = () => {
  if (!credentials.client_email || !credentials.private_key) {
    console.warn(" Credenciales de Google Drive incompletas. Las subidas retornarán falsos IDs.");
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
};

export const uploadFileToDrive = async (buffer, filename, mimeType) => {
  const drive = getDriveService();

  if (!drive) {
    // Falso upload si no hay keys
    return `fake-drive-id-${Date.now()}`;
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  try {
    // Convertir el buffer en un Stream que GoogleAPI entiende
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id',
    });

    return response.data.id;
  } catch (error) {
    console.error("Error subiendo archivo a Google Drive:", error);
    throw new Error('Error guardando el archivo magnético');
  }
};
