import { Doc } from "../models/Document";
import { Version } from "../models/Version";
import { ApiError } from "../utils/ApiError";

export class DocumentService {
  async create(title: string, workspaceId: string, userId: string) {
    const doc = await Doc.create({
      title,
      content: "",
      workspace: workspaceId,
      createdBy: userId,
      lastEditedBy: userId,
      collaborators: [userId],
    });
    return doc.populate(["createdBy", "lastEditedBy"].map((p) => ({ path: p, select: "username email avatar" })));
  }

  async getByWorkspace(workspaceId: string, query: { search?: string; tags?: string[]; archived?: boolean } = {}) {
    const filter: any = { workspace: workspaceId, isArchived: query.archived || false };
    if (query.search) filter.$text = { $search: query.search };
    if (query.tags?.length) filter.tags = { $in: query.tags };

    return Doc.find(filter)
      .populate("createdBy", "username email avatar")
      .populate("lastEditedBy", "username email avatar")
      .select("-content")
      .sort({ updatedAt: -1 });
  }

  async getById(docId: string) {
    const doc = await Doc.findById(docId)
      .populate("createdBy", "username email avatar")
      .populate("lastEditedBy", "username email avatar")
      .populate("collaborators", "username email avatar");
    if (!doc) throw ApiError.notFound("Document not found");
    return doc;
  }

  async update(docId: string, userId: string, data: { title?: string; content?: string; tags?: string[] }) {
    const doc = await Doc.findById(docId);
    if (!doc) throw ApiError.notFound("Document not found");

    if (data.content !== undefined && data.content !== doc.content) {
      await Version.create({
        document: doc._id,
        content: doc.content,
        version: doc.version,
        editedBy: userId,
        changeSummary: `Version ${doc.version}`,
      });
      doc.version += 1;
      doc.content = data.content;
    }

    if (data.title) doc.title = data.title;
    if (data.tags) doc.tags = data.tags;
    doc.lastEditedBy = userId as any;

    if (!doc.collaborators.some((c) => c.toString() === userId)) {
      doc.collaborators.push(userId as any);
    }

    await doc.save();
    return doc.populate([
      { path: "createdBy", select: "username email avatar" },
      { path: "lastEditedBy", select: "username email avatar" },
    ]);
  }

  async archive(docId: string) {
    const doc = await Doc.findByIdAndUpdate(docId, { isArchived: true }, { new: true });
    if (!doc) throw ApiError.notFound("Document not found");
    return doc;
  }

  async restore(docId: string) {
    const doc = await Doc.findByIdAndUpdate(docId, { isArchived: false }, { new: true });
    if (!doc) throw ApiError.notFound("Document not found");
    return doc;
  }

  async remove(docId: string) {
    await Version.deleteMany({ document: docId });
    const doc = await Doc.findByIdAndDelete(docId);
    if (!doc) throw ApiError.notFound("Document not found");
    return doc;
  }
}

export const documentService = new DocumentService();