import * as ProgramPriorityService from "../services/programPriority.service";
import { Request, Response } from "express";

export const getProgramPriorities = async (req: Request, res: Response) => {
  try {
    const programPriorities = await ProgramPriorityService.listProgramPriorities();
    res.status(200).json(programPriorities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProgramPriority = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const programPriority = await ProgramPriorityService.getProgramPriorityById(
      parseInt(id)
    );
    res.status(200).json(programPriority);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const saveProgramPriorities = async (req: Request, res: Response) => {
  try {
    const { priorities } = req.body; // Array of {programCode, programName, priority}
    const savedPriorities = await ProgramPriorityService.saveProgramPriorities(priorities);
    res.status(200).json(savedPriorities);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProgramPriority = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const programPriority = await ProgramPriorityService.updateProgramPriorityData(
      parseInt(id),
      data
    );
    res.status(200).json(programPriority);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProgramPriority = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedProgramPriority = await ProgramPriorityService.deleteProgramPriorityById(
      parseInt(id)
    );
    res.status(200).json(deletedProgramPriority);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};