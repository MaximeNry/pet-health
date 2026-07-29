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
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../../auth/auth.constants';
import { HouseholdMembershipGuard } from '../../../authorization/household-membership.guard';
import { HouseholdScope } from '../../../authorization/household-scope.decorator';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { AddPagesToDocumentUseCase } from '../application/add-pages-to-document.use-case';
import { ChangeDocumentTypeUseCase } from '../application/change-document-type.use-case';
import { CreateDocumentWithPagesUseCase } from '../application/create-document-with-pages.use-case';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case';
import { DownloadPageUseCase } from '../application/download-page.use-case';
import { extensionForMime } from '../application/file-extension';
import { GetPetDocumentUseCase } from '../application/get-pet-document.use-case';
import { ListPetDocumentsUseCase } from '../application/list-pet-documents.use-case';
import type { PageContent } from '../application/page-upload';
import type { UpdateDocumentDto } from './dto/update-document.dto';
import type { UploadDocumentDto } from './dto/upload-document.dto';
import {
  HealthDocumentResponse,
  toHealthDocumentResponse,
} from './dto/health-document-response.dto';

/** What multer hands us for each `file` part (typed locally: the full
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

/** Scans weigh ~1-3 MB; 15 MB leaves room for larger pages. */
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
/** Upper bound on pages in a single batch — a scanned document, not an archive. */
const MAX_PAGES_PER_BATCH = 30;

/**
 * Health documents REST API, scoped under a pet. Thin HTTP ↔ use cases
 * translation layer: multipart parsing (multiple ordered `file` parts =
 * ordered pages), projection of aggregates into `HealthDocumentResponse`.
 * Domain errors are mapped by the filter.
 */
@Controller('pets/:petId/documents')
@UseFilters(DomainExceptionFilter)
// Every route is scoped by its `:petId`; only members of that pet's household
// may read, add or remove its documents.
@UseGuards(HouseholdMembershipGuard)
@HouseholdScope({ type: 'pet', location: 'param', key: 'petId' })
export class HealthDocumentController {
  constructor(
    private readonly createDocument: CreateDocumentWithPagesUseCase,
    private readonly addPages: AddPagesToDocumentUseCase,
    private readonly listPetDocuments: ListPetDocumentsUseCase,
    private readonly getPetDocument: GetPetDocumentUseCase,
    private readonly downloadPage: DownloadPageUseCase,
    private readonly changeDocumentType: ChangeDocumentTypeUseCase,
    private readonly deleteDocument: DeleteDocumentUseCase,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('file', MAX_PAGES_PER_BATCH, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async create(
    @Param('petId') petId: string,
    @UploadedFiles() files: UploadedScanFile[] | undefined,
    @Body() dto: UploadDocumentDto,
    @Req() req: Request,
  ): Promise<HealthDocumentResponse> {
    const pages = this.toPages(files);
    if (!dto.householdId) {
      throw new BadRequestException('The « householdId » field is required.');
    }

    const user = req.user as AuthenticatedUser;
    const document = await this.createDocument.execute({
      petId,
      householdId: dto.householdId,
      userId: user.userId,
      documentType: dto.documentType,
      title: dto.title,
      documentDate: new Date(dto.documentDate),
      tags: this.parseTags(dto.tags),
      pages,
    });
    return toHealthDocumentResponse(document);
  }

  /** Appends more scanned pages to an existing document (order = file order). */
  @Post(':documentId/pages')
  @UseInterceptors(
    FilesInterceptor('file', MAX_PAGES_PER_BATCH, {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async append(
    @Param('petId') petId: string,
    @Param('documentId') documentId: string,
    @UploadedFiles() files: UploadedScanFile[] | undefined,
  ): Promise<HealthDocumentResponse> {
    const pages = this.toPages(files);
    const document = await this.addPages.execute({
      petId,
      documentId,
      pages,
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
   * Raw bytes of one page, served inline for the in-app preview; `?download=1`
   * switches to an attachment so the browser saves the file instead.
   */
  @Get(':documentId/pages/:pageId/content')
  @Header('Cache-Control', 'private, max-age=300')
  async pageContent(
    @Param('petId') petId: string,
    @Param('documentId') documentId: string,
    @Param('pageId') pageId: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { document, page, content } = await this.downloadPage.execute({
      petId,
      documentId,
      pageId,
    });

    const disposition = download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', page.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${this.encodeFileName(document.title, page.mimeType, page.position, document.pageCount)}`,
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

  /** Validates the multipart `file` parts and turns them into ordered pages. */
  private toPages(files: UploadedScanFile[] | undefined): PageContent[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one « file » part is required.');
    }
    for (const file of files) {
      if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Unsupported file type « ${file.mimetype} ». Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}.`,
        );
      }
    }
    return files.map((file) => ({
      mimeType: file.mimetype,
      content: file.buffer,
    }));
  }

  /** RFC 5987 file name for a page ("Carnet (2 of 3).pdf" → percent-encoded). */
  private encodeFileName(
    title: string,
    mimeType: string,
    position: number,
    totalPages: number,
  ): string {
    const safeTitle = title.trim().replace(/[\\/:*?"<>|]/g, ' ');
    const suffix = totalPages > 1 ? ` (${position} of ${totalPages})` : '';
    return encodeURIComponent(
      `${safeTitle}${suffix}.${extensionForMime(mimeType)}`,
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
