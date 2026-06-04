/**
 * Google Drive File Picker
 * Permite al usuario autenticarse con su cuenta Google y seleccionar
 * un archivo de su Drive para adjuntarlo como evidencia.
 */

const CLIENT_ID = '627159564526-hqejq9ch65n8ioq2hbjslv73hu249df7.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDR3wtLzVIikZ7WOb-FFRb5OZ1zO6ab-Io';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export interface GoogleDriveFile {
  name: string;
  url: string;
  mimeType?: string;
}

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
          resolve(response.access_token);
        }
      },
    });
    // Sin prompt si ya dio consentimiento antes
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * Abre el Google Drive Picker.
 * El usuario se autentica con su cuenta Google, navega su Drive
 * y selecciona un archivo. Retorna la URL del archivo seleccionado.
 */
export async function openGoogleDrivePicker(): Promise<GoogleDriveFile | null> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch {
    throw new Error('No se pudo autenticar con Google. Verifica tu cuenta e intenta de nuevo.');
  }

  await loadPickerApi();

  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;

    const picker = new google.picker.PickerBuilder()
      .addView(google.picker.ViewId.DOCS)
      .addView(google.picker.ViewId.RECENTLY_PICKED)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED && data.docs?.length > 0) {
          const file = data.docs[0];
          resolve({
            name: file.name || 'Documento',
            url: file.url || `https://drive.google.com/file/d/${file.id}/view`,
            mimeType: file.mimeType,
          });
        } else if (data.action === google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();

    picker.setVisible(true);
  });
}
