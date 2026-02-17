import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/s3";
import { env } from "../config/env";
import { v4 as uuid } from "uuid";
import path from "path";

export class S3Service {
  private bucket = env.aws.s3Bucket;

  async uploadFile(
    file: Express.Multer.File,
    workspaceId: string,
    docId: string
  ): Promise<{ key: string; filename: string }> {
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const key = `workspaces/${workspaceId}/documents/${docId}/${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          workspaceId,
          documentId: docId,
        },
      })
    );

    return { key, filename };
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(s3Client, cmd, { expiresIn });
  }

  async getSignedUploadUrl(
    workspaceId: string,
    docId: string,
    filename: string,
    contentType: string
  ): Promise<{ url: string; key: string }> {
    const ext = path.extname(filename);
    const key = `workspaces/${workspaceId}/documents/${docId}/${uuid()}${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(s3Client, cmd, { expiresIn: 600 });
    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async listFiles(prefix: string) {
    const result = await s3Client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
    );
    return result.Contents || [];
  }
}

export const s3Service = new S3Service();