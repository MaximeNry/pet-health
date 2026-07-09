import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  HealthDocumentNotFoundError,
  MissingDriveAccessError,
} from '../domain/health-document.errors';
import type {
  DocumentStorage,
  StoredFile,
  StoredFileRef,
  UploadFileParams,
} from '../domain/document-storage.port';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
const APP_FOLDER_NAME = 'PetHealth';

/**
 * Google Drive adapter for the `DocumentStorage` port. Uploads go to the
 * *user's own* Drive: the stored refresh token (granted with the
 * non-sensitive `drive.file` scope at login) is exchanged for a short-lived
 * access token on each upload. Files land in a "PetHealth" folder that the
 * app creates on first use — `drive.file` only sees files this app created,
 * so the lookup cannot collide with the user's personal folders.
 */
@Injectable()
export class GoogleDriveStorageAdapter implements DocumentStorage {
  private readonly logger = new Logger(GoogleDriveStorageAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  async upload(params: UploadFileParams): Promise<StoredFile> {
    const accessToken = await this.getAccessToken(params.ownerUserId);
    const folderId = await this.ensureAppFolder(accessToken);

    const metadata = {
      name: params.fileName,
      parents: [folderId],
      // Queryable marker linking the Drive file back to the pet.
      appProperties: { petId: params.petId },
    };
    const body = this.buildMultipartBody(metadata, params);

    const response = await fetch(DRIVE_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/related; boundary=pethealth-upload',
      },
      body,
    });
    if (!response.ok) {
      this.logger.error(
        `Drive upload failed (${response.status}): ${await response.text()}`,
      );
      throw new Error('The upload to Google Drive failed.');
    }
    const file = (await response.json()) as { id: string };
    return { fileId: file.id };
  }

  async download(ref: StoredFileRef): Promise<Uint8Array> {
    const accessToken = await this.getAccessToken(ref.ownerUserId);
    const response = await fetch(
      `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(ref.fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (response.status === 404) {
      throw new HealthDocumentNotFoundError(ref.fileId);
    }
    if (!response.ok) {
      this.logger.error(
        `Drive download failed (${response.status}): ${await response.text()}`,
      );
      throw new Error('The download from Google Drive failed.');
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async delete(ref: StoredFileRef): Promise<void> {
    const accessToken = await this.getAccessToken(ref.ownerUserId);
    const response = await fetch(
      `${DRIVE_FILES_ENDPOINT}/${encodeURIComponent(ref.fileId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    );
    // 404 = already gone; deletion is idempotent from the domain's viewpoint.
    if (!response.ok && response.status !== 404) {
      this.logger.error(
        `Drive deletion failed (${response.status}): ${await response.text()}`,
      );
      throw new Error('The deletion on Google Drive failed.');
    }
  }

  /** Exchanges the user's refresh token for a short-lived access token. */
  private async getAccessToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true },
    });
    if (!user?.googleRefreshToken) {
      throw new MissingDriveAccessError();
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      // invalid_grant = the refresh token was revoked or expired: the user
      // must sign in with Google again. Anything else is our problem.
      if (detail.includes('invalid_grant')) {
        throw new MissingDriveAccessError();
      }
      this.logger.error(
        `Google token exchange failed (${response.status}): ${detail}`,
      );
      throw new Error('Could not authenticate against Google Drive.');
    }
    const tokens = (await response.json()) as { access_token: string };
    return tokens.access_token;
  }

  /** Finds the app folder in the user's Drive, creating it on first upload. */
  private async ensureAppFolder(accessToken: string): Promise<string> {
    const query = [
      `name = '${APP_FOLDER_NAME}'`,
      `mimeType = 'application/vnd.google-apps.folder'`,
      'trashed = false',
    ].join(' and ');
    const searchUrl = `${DRIVE_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`;

    const search = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!search.ok) {
      this.logger.error(
        `Drive folder lookup failed (${search.status}): ${await search.text()}`,
      );
      throw new Error('Could not look up the PetHealth folder in Drive.');
    }
    const { files } = (await search.json()) as { files: { id: string }[] };
    if (files.length > 0) {
      return files[0].id;
    }

    const create = await fetch(`${DRIVE_FILES_ENDPOINT}?fields=id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (!create.ok) {
      this.logger.error(
        `Drive folder creation failed (${create.status}): ${await create.text()}`,
      );
      throw new Error('Could not create the PetHealth folder in Drive.');
    }
    const folder = (await create.json()) as { id: string };
    return folder.id;
  }

  /** multipart/related body: JSON metadata part + base64-encoded media part. */
  private buildMultipartBody(
    metadata: object,
    params: UploadFileParams,
  ): Uint8Array<ArrayBuffer> {
    const boundary = 'pethealth-upload';
    const combined = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          `${JSON.stringify(metadata)}\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: ${params.mimeType}\r\n` +
          'Content-Transfer-Encoding: base64\r\n\r\n',
      ),
      Buffer.from(Buffer.from(params.content).toString('base64')),
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    // Re-copy into a plain ArrayBuffer-backed view: the fetch `BodyInit`
    // typing rejects Buffer's ArrayBufferLike-backed views.
    const body = new Uint8Array(new ArrayBuffer(combined.byteLength));
    body.set(combined);
    return body;
  }
}
