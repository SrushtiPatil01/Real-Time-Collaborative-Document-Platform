import { Workspace } from "../models/Workspace";
import { Doc } from "../models/Document";
import { ApiError } from "../utils/ApiError";
import { WorkspaceRole } from "../types";

export class WorkspaceService {
  async create(name: string, description: string | undefined, ownerId: string) {
    const workspace = await Workspace.create({
      name,
      description,
      owner: ownerId,
      members: [{ user: ownerId, role: "owner", joinedAt: new Date() }],
    });
    return workspace.populate("members.user", "username email avatar");
  }

  async getUserWorkspaces(userId: string) {
    return Workspace.find({ "members.user": userId })
      .populate("owner", "username email avatar")
      .populate("members.user", "username email avatar")
      .sort({ updatedAt: -1 });
  }

  async getById(workspaceId: string, userId: string) {
    const ws = await Workspace.findById(workspaceId)
      .populate("owner", "username email avatar")
      .populate("members.user", "username email avatar");
    if (!ws) throw ApiError.notFound("Workspace not found");

    const isMember = ws.members.some((m) => m.user && (m.user as any)._id.toString() === userId);
    if (!isMember) throw ApiError.forbidden("Not a workspace member");

    return ws;
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole = "editor") {
    const ws = await Workspace.findById(workspaceId);
    if (!ws) throw ApiError.notFound("Workspace not found");

    const exists = ws.members.some((m) => m.user.toString() === userId);
    if (exists) throw ApiError.conflict("User already a member");

    ws.members.push({ user: userId as any, role, joinedAt: new Date() });
    await ws.save();
    return ws.populate("members.user", "username email avatar");
  }

  async removeMember(workspaceId: string, userId: string) {
    const ws = await Workspace.findById(workspaceId);
    if (!ws) throw ApiError.notFound("Workspace not found");

    if (ws.owner.toString() === userId) {
      throw ApiError.badRequest("Cannot remove workspace owner");
    }

    ws.members = ws.members.filter((m) => m.user.toString() !== userId) as any;
    await ws.save();
    return ws;
  }

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const ws = await Workspace.findById(workspaceId);
    if (!ws) throw ApiError.notFound("Workspace not found");

    const member = ws.members.find((m) => m.user.toString() === userId);
    if (!member) throw ApiError.notFound("Member not found");
    if (ws.owner.toString() === userId) throw ApiError.badRequest("Cannot change owner role");

    member.role = role;
    await ws.save();
    return ws.populate("members.user", "username email avatar");
  }

  async update(workspaceId: string, data: { name?: string; description?: string }) {
    const ws = await Workspace.findByIdAndUpdate(workspaceId, data, { new: true })
      .populate("members.user", "username email avatar");
    if (!ws) throw ApiError.notFound("Workspace not found");
    return ws;
  }

  async remove(workspaceId: string) {
    await Doc.deleteMany({ workspace: workspaceId });
    const ws = await Workspace.findByIdAndDelete(workspaceId);
    if (!ws) throw ApiError.notFound("Workspace not found");
    return ws;
  }
}

export const workspaceService = new WorkspaceService();