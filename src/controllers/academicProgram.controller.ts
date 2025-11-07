import * as AcademicProgramService from "../services/academicProgram.service";
import { Request, Response } from "express";

export const getAcademicPrograms = async (req: Request, res: Response) => {
  try {
    const academicPrograms =
      await AcademicProgramService.listAcademicPrograms();
    res.status(200).json(academicPrograms);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAcademicProgram = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const academicProgram = await AcademicProgramService.getAcademicProgramById(
      parseInt(id)
    );
    res.status(200).json(academicProgram);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addAcademicProgram = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const academicProgram = await AcademicProgramService.createAcademicProgram(
      data
    );
    res.status(200).json(academicProgram);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAcademicProgram = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const academicProgram =
      await AcademicProgramService.updateAcademicProgramData(
        parseInt(id),
        data
      );
    res.status(200).json(academicProgram);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAcademicProgram = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const academicProgram = await AcademicProgramService.deleteAcademicProgram(
      parseInt(id)
    );
    res.status(200).json(academicProgram);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
