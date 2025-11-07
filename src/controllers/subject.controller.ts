import * as SubjectSlice from "../services/subject.service";
import { Request, Response } from "express";

export const addSubject = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Handle tags field - parse JSON string if it exists
    if (data.tags && typeof data.tags === 'string') {
      try {
        data.tags = JSON.parse(data.tags);
      } catch (error) {
        console.error('Error parsing tags JSON:', error);
        data.tags = [];
      }
    }
    
    // Handle prerequisite field - parse JSON string if it exists
    if (data.prerequisite && typeof data.prerequisite === 'string') {
      try {
        data.prerequisite = JSON.parse(data.prerequisite);
      } catch (error) {
        console.error('Error parsing prerequisite JSON:', error);
        data.prerequisite = [];
      }
    }
    
    const subject = await SubjectSlice.createSubject(data);
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await SubjectSlice.listSubjects();
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const subject = await SubjectSlice.getSubjectById(parseInt(id));
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  try {
    // Handle tags field - parse JSON string if it exists
    if (data.tags && typeof data.tags === 'string') {
      try {
        data.tags = JSON.parse(data.tags);
      } catch (error) {
        console.error('Error parsing tags JSON:', error);
        data.tags = [];
      }
    }
    
    // Handle prerequisite field - parse JSON string if it exists
    if (data.prerequisite && typeof data.prerequisite === 'string') {
      try {
        data.prerequisite = JSON.parse(data.prerequisite);
      } catch (error) {
        console.error('Error parsing prerequisite JSON:', error);
        data.prerequisite = [];
      }
    }
    
    const subject = await SubjectSlice.updateSubjectData(parseInt(id), data);
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const subject = await SubjectSlice.deleteSubject(parseInt(id));
    res.status(200).json(subject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchSubject = async (req: Request, res: Response) => {
  const { query } = req.params;
  try {
    const subjects = await SubjectSlice.searchSubjectQuery(query);
    res.status(200).json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
