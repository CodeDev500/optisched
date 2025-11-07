import * as curriculumService from "../services/curriculum.service";
import { Request, Response } from "express";
import { db } from "../utils/db.server";

export const createCurriculum = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { subjects } = req.body;

  if (!subjects || !Array.isArray(subjects)) {
    res.status(400).json({ error: "Invalid subjects data" });
    return;
  }

  try {
    // First, get existing curriculum for this program, year level, and curriculum year
    const { programCode, yearLevel, curriculumYear } = subjects[0] || {};
    
    if (!programCode || !yearLevel) {
      res.status(400).json({ error: "Program code and year level are required" });
      return;
    }

    if (!curriculumYear) {
      res.status(400).json({ error: "Curriculum year is required" });
      return;
    }

    // Use upsert logic: update existing, create new
    const results = [];
    
    for (const subject of subjects) {
      if (subject.id) {
        // Update existing subject
        const updated = await db.curriculumCourse.update({
          where: { id: subject.id },
          data: {
            curriculumYear: subject.curriculumYear || null,
            programCode: subject.programCode || null,
            programName: subject.programName || null,
            subjectCode: subject.subjectCode || null,
            subjectDescription: subject.subjectDescription || null,
            lec: subject.lec ?? 0,
            lab: subject.lab ?? 0,
            units: subject.units ?? 0,
            hours: subject.hours ?? null,
            period: subject.period || null,
            yearLevel: subject.yearLevel || null,
          },
        });
        results.push(updated);
      } else {
        // Create new subject
        const created = await db.curriculumCourse.create({
          data: {
            curriculumYear: subject.curriculumYear || null,
            programCode: subject.programCode || null,
            programName: subject.programName || null,
            subjectCode: subject.subjectCode || null,
            subjectDescription: subject.subjectDescription || null,
            lec: subject.lec ?? 0,
            lab: subject.lab ?? 0,
            units: subject.units ?? 0,
            hours: subject.hours ?? null,
            period: subject.period || null,
            yearLevel: subject.yearLevel || null,
          },
        });
        results.push(created);
      }
    }

    res.status(200).json({
      message: "Curriculum saved successfully",
      savedCount: results.length,
      subjects: results,
    });
  } catch (error) {
    console.error("Error saving curriculum:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllCurriculums = async (req: Request, res: Response) => {
  try {
    const curriculums = await curriculumService.listCurriculumCourses();
    res.status(200).json(curriculums);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurriculum = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const curriculum = await curriculumService.getCurriculumCourseById(+id);
    res.status(200).json(curriculum);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCurriculum = async (req: Request, res: Response) => {
  const { subjects } = req.body;

  if (!subjects || !Array.isArray(subjects)) {
    res.status(400).json({ error: "Invalid subjects data" });
    return;
  }

  try {
    const results = [];
    
    for (const subject of subjects) {
      if (subject.id) {
        // Update existing subject
        const updated = await curriculumService.updateCurriculumCourse(subject.id, {
          curriculumYear: subject.curriculumYear,
          programCode: subject.programCode,
          programName: subject.programName,
          subjectCode: subject.subjectCode,
          subjectDescription: subject.subjectDescription,
          lec: subject.lec,
          lab: subject.lab,
          units: subject.units,
          hours: subject.hours,
          period: subject.period,
          yearLevel: subject.yearLevel,
        });
        results.push(updated);
      } else {
        // Create new subject
        const created = await curriculumService.createCurriculumCourse({
          curriculumYear: subject.curriculumYear,
          programCode: subject.programCode,
          programName: subject.programName,
          subjectCode: subject.subjectCode,
          subjectDescription: subject.subjectDescription,
          lec: subject.lec,
          lab: subject.lab,
          units: subject.units,
          hours: subject.hours,
          period: subject.period,
          yearLevel: subject.yearLevel,
        });
        results.push(created);
      }
    }

    res.status(200).json({
      message: "Curriculum updated successfully",
      subjects: results,
    });
  } catch (error) {
    console.error("Error updating curriculum:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCurriculumSubject = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const deleted = await curriculumService.deleteCurriculumCourse(+id);
    res.status(200).json({
      message: "Subject deleted successfully",
      deleted,
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCurriculumByProgramAndYear = async (
  req: Request,
  res: Response
) => {
  const { programCode, yearLevel } = req.params;

  try {
    const curriculum =
      await curriculumService.getCurriculumCoursesByProgramandLevel(
        programCode,
        yearLevel
      );
    res.status(200).json(curriculum);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchSubjectsBySemester = async (req: Request, res: Response) => {
  try {
    const { programCode, yearLevel } = req.params;
    const { semester, search } = req.query;
    
    const whereClause: any = {
      programCode,
      yearLevel,
    };
    
    if (semester && semester !== 'all') {
      whereClause.period = semester;
    }
    
    if (search) {
      whereClause.OR = [
        {
          subjectCode: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          subjectDescription: {
            contains: search as string,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    const subjects = await db.curriculumCourse.findMany({
      where: whereClause,
      include: {
        courseOfferings: {
          include: {
            roomSchedules: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    // Transform the data to match frontend expectations
    const transformedSubjects = subjects.map((subject) => {
      // Flatten all schedules from all course offerings
      const allSchedules = subject.courseOfferings.flatMap((offering) =>
        offering.roomSchedules.map((schedule) => ({
          id: schedule.id,
          day: schedule.day,
          timeStarts: schedule.timeStarts,
          timeEnds: schedule.timeEnds,
          room: schedule.room,
          isLoaded: schedule.isLoaded,
          offeringId: schedule.offeringId,
          sectionName: offering.sectionName,
          instructor: schedule.instructor
            ? {
                id: schedule.instructor.id,
                name: `${schedule.instructor.firstname} ${schedule.instructor.lastname}`,
                email: schedule.instructor.email,
              }
            : null,
        }))
      );

      return {
        id: subject.id,
        subjectCode: subject.subjectCode,
        subjectDescription: subject.subjectDescription,
        lec: subject.lec,
        lab: subject.lab,
        units: subject.units,
        yearLevel: subject.yearLevel,
        semester: subject.period,
        prerequisites: [], // Add if available in schema
        schedules: allSchedules, // Add flattened schedules array
        courseOfferings: subject.courseOfferings.map((offering) => ({
          id: offering.id,
          courseType: offering.courseType,
          description: offering.description,
          sectionName: offering.sectionName,
          yearLevel: offering.yearLevel,
          roomSchedules: offering.roomSchedules.map((schedule) => ({
            id: schedule.id,
            day: schedule.day,
            timeStarts: schedule.timeStarts,
            timeEnds: schedule.timeEnds,
            room: schedule.room,
            isLoaded: schedule.isLoaded,
            offeringId: schedule.offeringId,
            sectionName: offering.sectionName,
            instructor: schedule.instructor
              ? {
                  id: schedule.instructor.id,
                  name: `${schedule.instructor.firstname} ${schedule.instructor.lastname}`,
                  email: schedule.instructor.email,
                }
              : null,
          })),
        })),
      };
    });
    
    res.status(200).json(transformedSubjects);
  } catch (error) {
    console.error('Error searching subjects by semester:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
