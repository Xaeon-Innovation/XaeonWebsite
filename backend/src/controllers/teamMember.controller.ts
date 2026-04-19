import type { Request, Response } from "express";
import TeamMember from "../models/teamMember.model";

export const getTeamMembers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const teamMembers = await TeamMember.find().sort({ sortOrder: 1, createdAt: 1 });
    res.status(200).json({ teamMembers });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch team members",
    });
  }
};

export const createTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body?.teamMember as Record<string, unknown> | undefined;
    if (!payload || typeof payload.name !== "string" || typeof payload.role !== "string") {
      res.status(400).json({ error: "teamMember with name and role is required" });
      return;
    }
    if (typeof payload.photoUrl !== "string" || !payload.photoUrl.trim()) {
      res.status(400).json({ error: "photoUrl is required" });
      return;
    }
    const created = await TeamMember.create({
      name: payload.name.trim(),
      role: payload.role.trim(),
      photoUrl: payload.photoUrl.trim(),
      sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : 0,
      published: Boolean(payload.published),
    });
    res.status(200).json({ message: "Team member created", teamMember: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to create team member",
    });
  }
};

export const updateTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body?.teamMember as Record<string, unknown> | undefined;
    const id = body?.id;
    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "teamMember.id is required" });
      return;
    }
    const { id: _drop, ...rest } = body;
    const updated = await TeamMember.findByIdAndUpdate(
      id,
      {
        ...(typeof rest.name === "string" ? { name: rest.name.trim() } : {}),
        ...(typeof rest.role === "string" ? { role: rest.role.trim() } : {}),
        ...(typeof rest.photoUrl === "string" ? { photoUrl: rest.photoUrl.trim() } : {}),
        ...(typeof rest.sortOrder === "number" ? { sortOrder: rest.sortOrder } : {}),
        ...(typeof rest.published === "boolean" ? { published: rest.published } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Team member not found" });
      return;
    }
    res.status(200).json({ message: "Team member updated", teamMember: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to update team member",
    });
  }
};

export const deleteTeamMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TeamMember.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Team member not found" });
      return;
    }
    res.status(200).json({ message: "Team member deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to delete team member",
    });
  }
};
