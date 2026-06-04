/**
 * Google Drive File Picker
 * Permite al usuario autenticarse con su cuenta Google, seleccionar
 * un archivo de su Drive y descargarlo como File para subirlo al servidor.
 */

const CLIENT_ID = '627159564526-hqejq9ch65n8ioq2hbjslv73hu249df7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDR3wtLzVIikZ7WOb-FFRb5OZ1zO6ab-Io';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// Tipos de Google Workspace que se exportan como PDF
const GOOGLE_APPS_EXPORT: Record<string, string> = {
  'application/vnd.google-apps.document':     'application/pdf',
  'application/vnd.google-apps.spreadsheet':  'application/pdf',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing':      'image/png',
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    document.head.appendChild(s);
  });
}

async function loadPickerApi(): Promise<void> {
  await loadScript('https://apis.google.com/js/api.js');
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gapi.load('picker', resolve);
  });
}

async function getAccessToken(): Promise<string> {
  await loadScript('https://accounts.google.com/gsi/client');
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
        } else {
          resolve(response.access_token as string);
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function downloadFile(token: string, fileId: string, name: string, mimeType: string): Promise<File> {
  const exportMime = GOOGLE_APPS_EXPORT[mimeType];
  const finalName = exportMime === 'application/pdf' ? `${name}.pdf` : name;

  const url = exportMime
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('No se pudo descargar el archivo de Google Drive');

  const blob = await res.blob();
  return new File([blob], finalName, { type: exportMime || mimeType || blob.type });
}

/**
 * Abre el Google Drive Picker, descarga el archivo seleccionado
 * y lo retorna como un objeto File listo para subir al servidor.
 */
export async function openGoogleDrivePicker(): Promise<File | null> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch {
    throw new Error('No se pudo autenticar con Google. Verifica tu cuenta e intenta de nuevo.');
  }

  await loadPickerApi();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const google = (window as any).google;

  // Paso 1: usuario elige el archivo en el picker
  const picked = await new Promise<{ id: string; name: string; mimeType: string } | null>((resolve) => {
    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .addView(google.picker.ViewId.RECENTLY_PICKED)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED && data.docs?.length > 0) {
          const f = data.docs[0];
          resolve({ id: f.id, name: f.name || 'Documento', mimeType: f.mimeType || '' });
        } else if (data.action === google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();
    picker.setVisible(true);
  });

  if (!picked) return null;

  // Paso 2: descargar el archivo y retornar como File
  return downloadFile(token, picked.id, picked.name, picked.mimeType);
}
