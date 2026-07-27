import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../../auth/auth.constants';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { ChangeDocumentTypeUseCase } from '../application/change-document-type.use-case';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case';
import { DownloadDocumentUseCase } from '../application/download-document.use-case';
import { extensionForMime } from '../application/file-extension';
import { GetPetDocumentUseCase } from '../application/get-pet-document.use-case';
import { ListPetDocumentsUseCase } from '../application/list-pet-documents.use-case';
import { UploadDocumentUseCase } from '../application/upload-document.use-case';
import type { UpdateDocumentDto } from './dto/update-document.dto';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import {
  HealthDocumentResponse,
  toHealthDocumentResponse,
} from './dto/health-document-response.dto';

/** What multer hands us for the `file` part (typed locally: the full
 * `Express.Multer.File` type would require the `@types/multer` package for
 * three fields). */
interface UploadedScanFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/** Scans weigh ~1-3 MB; 15 MB leaves room for multi-page PDFs. */
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/**
 * Health documents REST API, scoped under a pet. Thin HTTP ↔ use cases
 * translation layer: multipart parsing, projection of entities into
 * `HealthDocumentResponse`. Domain errors are mapped by the filter.
 */
@Controller('pets/:petId/documents')
@UseFilters(DomainExceptionFilter)
export class HealthDocumentController {
  constructor(
    private readonly uploadDocument: UploadDocumentUseCase,
    private readonly listPetDocuments: ListPetDocumentsUseCase,
    private readonly getPetDocument: GetPetDocumentUseCase,
    private readonly downloadDocument: DownloadDocumentUseCase,
    private readonly changeDocumentType: ChangeDocumentTypeUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  async upload(
    @Param('petId') petId: string,
    @UploadedFile() file: UploadedScanFile | undefined,
    @Body() dto: UploadDocumentDto,
    @Req() req: Request,
  ): Promise<HealthDocumentResponse> {
    if (!file) {
      throw new BadRequestException('The « file » part is required.');
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type « ${file.mimetype} ». Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}.`,
      );
    }
    if (!dto.householdId) {
      throw new BadRequestException('The « householdId » field is required.');
    }

    const user = req.user as AuthenticatedUser;
    const document = await this.uploadDocument.execute({
      petId,
      householdId: dto.householdId,
      userId: user.userId,
      documentType: dto.documentType,
      title: dto.title,
      documentDate: new Date(dto.documentDate),
      tags: this.parseTags(dto.tags),
      mimeType: file.mimetype,
      content: file.buffer,
    });
    return toHealthDocumentResponse(document);
  }

  @Get()
  async list(@Param('petId') petId: string): Promise<HealthDocumentResponse[]> {
    const documents = await this.listPetDocuments.execute(petId);
    return documents.map(toHealthDocumentResponse);
  }

  @Get(':documentId')
  async get(
    @Param('petId') petId: string,
    @Param('documentId') documentId: string,
  ): Promise<HealthDocumentResponse> {
    const document = await this.getPetDocument.execute(petId, documentId);
    return toHealthDocumentResponse(document);
  }

  /**
   * Raw file bytes, served inline for the in-app preview; `?download=1`
   * switches to an attachment so the browser saves the file instead.
   */
  @Get(':documentId/content')
  @Header('Cache-Control', 'private, max-age=300')
  async content(
    @Param('petId') petId: string,
    @Param('documentId') documentId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { document, content } = await this.downloadDocument.execute({
      petId,
      documentId,
    });

    const disposition = download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${this.encodeFileName(document)}`,
    );
    return new StreamableFile(content);
  }

  @Patch(':documentId')
  async update(
    @Param('petId') petId: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<HealthDocumentResponse> {
    if (!dto.documentType) {
      throw new BadRequestException('The « documentType » field is required.');
    }
    const document = await this.changeDocumentType.execute({
      petId,
      documentId,
      documentType: dto.documentType,
    });
    return toHealthDocumentResponse(document);
  }

  @Delete(':documentId')
  @HttpCode(204)
  async remove(
    @Param('petId') petId: string,
    @Param('documentId') documentId: string,
  ): Promise<void> {
    await this.deleteDocument.execute({
      petId,
      documentId,
    });
  }

  /** RFC 5987 file name ("Carnet.pdf" → percent-encoded UTF-8). */
  private encodeFileName(document: {
    title: string;
    mimeType: string;
  }): string {
    const safeTitle = document.title.trim().replace(/[\\/:*?"<>|]/g, ' ');
    return encodeURIComponent(
      `${safeTitle}.${extensionForMime(document.mimeType)}`,
    );
  }

  /** `tags` travels as a JSON array string inside the multipart form. */
  private parseTags(raw: string | undefined): string[] {
    if (raw === undefined || raw === '') {
      return [];
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('« tags » must be a JSON array.');
    }
    if (!Array.isArray(parsed)) {
      throw new BadRequestException('« tags » must be an array of strings.');
    }
    const tags: string[] = [];
    for (const tag of parsed as unknown[]) {
      if (typeof tag !== 'string') {
        throw new BadRequestException('« tags » must be an array of strings.');
      }
      tags.push(tag);
    }
    return tags;
  }
}
