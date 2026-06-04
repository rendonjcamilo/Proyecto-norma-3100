/**
 * OneDrive File Picker — integración con Microsoft Graph API
 * Permite al usuario autenticarse con su cuenta Microsoft y seleccionar
 * un archivo de su OneDrive o SharePoint para adjuntarlo como evidencia.
 */

import { PublicClientApplication, type AccountInfo } from '@azure/msal-browser';

const CLIENT_ID = '1c0de1a4-f19d-4a71-8603-97fb4fa6b7be';
const SCOPES = ['Files.ReadWrite', 'User.Read', 'offline_access'];
const GRAPH = 'https://graph.microsoft.com/v1.0';

let _msal: PublicClientApplication | null = null;

async function getMsal(): Promise<PublicClientApplication> {
  if (_msal) { return _msal; }
  _msal = new PublicClientApplication({
    auth: {
      clientId: CLIENT_ID,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: window.location.origin,
    },
    cache: { cacheLocation: 'sessionStorage' },
  });
  await _msal.initialize();
  return _msal;
}

async function getAccessToken(): Promise<string> {
  const msal = await getMsal();
  const accounts = msal.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await msal.acquireTokenSilent({ scopes: SCOPES, account: accounts[0] as AccountInfo });
      return result.accessToken;
    } catch {
      // Token expirado — abre popup de login
    }
  }

  const result = await msal.loginPopup({ scopes: SCOPES });
  return result.accessToken;
}

async function createSharingLink(token: string, itemId: string, driveId: string): Promise<string> {
  const res = await fetch(`${GRAPH}/drives/${driveId}/items/${itemId}/createLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'view', scope: 'anonymous' }),
  });

  if (!res.ok) {
    // Si el tenant no permite links anónimos, usar el webUrl del ítem
    return '';
  }

  const data = await res.json();
  return data.link?.webUrl || '';
}

export interface OneDriveFile {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

/**
 * Abre el picker de OneDrive v8 en un popup.
 * El usuario se autentica con su cuenta Microsoft, navega su OneDrive
 * y selecciona un archivo. Retorna la URL para compartir el archivo.
 */
export async function openOneDrivePicker(): Promise<OneDriveFile | null> {
  let token: string;
  try {
    token = await getAccessToken();
  } catch {
    throw new Error('No se pudo autenticar con Microsoft. Verifica tu cuenta e intenta de nuevo.');
  }

  return new Promise((resolve) => {
    const channelId = Math.random().toString(36).slice(2, 10);

    const pickerParams = new URLSearchParams({
      sdk: '8.0',
      entry: JSON.stringify({ oneDrive: { files: {} } }),
      authentication: JSON.stringify({}),
      messaging: JSON.stringify({ origin: window.location.origin, channelId }),
      typesAndSources: JSON.stringify({
        mode: 'files',
        pivots: { oneDrive: true, recent: true, sharedLibraries: true },
      }),
      selection: JSON.stringify({ mode: 'single' }),
    });

    const pickerWindow = window.open(
      `https://onedrive.live.com/picker?${pickerParams}`,
      'OneDrivePicker',
      'width=820,height=620,left=200,top=100,resizable=yes,scrollbars=yes'
    );

    if (!pickerWindow) {
      resolve(null);
      return;
    }

    let port: MessagePort | null = null;
    let done = false;

    const finish = (result: OneDriveFile | null) => {
      if (done) { return; }
      done = true;
      window.removeEventListener('message', onWindowMessage);
      clearInterval(closedPoll);
      pickerWindow.close();
      resolve(result);
    };

    const onPortMessage = async (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === 'authenticate') {
        port?.postMessage({ type: 'token', token });
      } else if (msg.type === 'pick' && msg.items?.length > 0) {
        const item = msg.items[0];
        const driveId: string = item.parentReference?.driveId || '';
        const itemId: string = item.id || '';

        // Intentar crear link anónimo; si falla usar webUrl
        let url = item.webUrl || '';
        if (driveId && itemId) {
          const shareUrl = await createSharingLink(token, itemId, driveId).catch(() => '');
          if (shareUrl) { url = shareUrl; }
        }

        finish({
          name: item.name || 'Documento',
          url,
          size: item.size,
          mimeType: item.file?.mimeType,
        });
      } else if (msg.type === 'cancel') {
        finish(null);
      }
    };

    const onWindowMessage = (event: MessageEvent) => {
      if (event.source !== pickerWindow) { return; }
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      if (data.type === 'initialize' && data.channelId === channelId) {
        port = event.ports[0];
        port.addEventListener('message', onPortMessage);
        port.start();
        port.postMessage({ type: 'activate' });
      }
    };

    window.addEventListener('message', onWindowMessage);

    // Detectar si el usuario cierra el popup manualmente
    const closedPoll = setInterval(() => {
      if (pickerWindow.closed) { finish(null); }
    }, 500);
  });
}

/** Cierra la sesión de Microsoft del usuario actual */
export async function signOutMicrosoft(): Promise<void> {
  const msal = await getMsal();
  const accounts = msal.getAllAccounts();
  if (accounts.length > 0) {
    await msal.logoutPopup({ account: accounts[0] as AccountInfo });
  }
}

/** Retorna el nombre de la cuenta Microsoft activa, o null si no hay sesión */
export async function getMicrosoftAccount(): Promise<string | null> {
  const msal = await getMsal();
  const accounts = msal.getAllAccounts();
  return accounts[0]?.name || accounts[0]?.username || null;
}
