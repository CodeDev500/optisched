import { Request, Response } from "express";
import * as UserSubjectService from "../services/userSubject.service";

export const assignSubjectToUser = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId } = req.body;
    const assignment = await UserSubjectService.createUserSubjectAssignment({
      userId: parseInt(userId),
      subjectId: parseInt(subjectId)
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserSubjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userSubjects = await UserSubjectService.getUserSubjects(parseInt(userId));
    res.status(200).json(userSubjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubjectUsers = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const subjectUsers = await UserSubjectService.getSubjectUsers(parseInt(subjectId));
    res.status(200).json(subjectUsers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeSubjectFromUser = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId } = req.params;
    const result = await UserSubjectService.removeUserSubjectAssignment(
      parseInt(userId),
      parseInt(subjectId)
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUserSubjects = async (req: Request, res: Response) => {
  try {
    const assignments = await UserSubjectService.getAllUserSubjectAssignments();
    res.status(200).json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFacultyWithSubjects = async (req: Request, res: Response) => {
  try {
    const faculty = await UserSubjectService.getFacultyWithAssignedSubjects();
    res.status(200).json(faculty);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};