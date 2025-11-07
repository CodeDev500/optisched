import { Request, Response } from "express";
import * as FacultyRecommendationService from "../services/facultyRecommendation.service";

export const getFacultyRecommendationsForSubject = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;
    const { department } = req.query;

    // First, get the subject with its tags
    const subject = await require("../services/subject.service").getSubjectById(parseInt(subjectId));
    
    if (!subject) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }

    const subjectTags = subject.tags ? (Array.isArray(subject.tags) ? subject.tags : [subject.tags]) : [];
    
    const recommendations = await FacultyRecommendationService.getFacultyRecommendationsForSubject(
      subjectTags,
      department as string
    );

    res.status(200).json({
      subject: {
        id: subject.id,
        code: subject.subjectCode,
        name: subject.subjectDescription,
        tags: subjectTags,
      },
      recommendations,
    });
  } catch (error: any) {
    console.error("Error getting faculty recommendations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFacultyRecommendationsForCurriculumCourse = async (req: Request, res: Response) => {
  try {
    const { curriculumCourseId } = req.params;
    const { department } = req.query;

    // Get the curriculum course with its subject
    const curriculumCourse = await require("../services/curriculum.service").getCurriculumCourseById(parseInt(curriculumCourseId));
    
    if (!curriculumCourse || !curriculumCourse.subject) {
      res.status(404).json({ message: "Curriculum course or associated subject not found" });
      return;
    }

    const subjectTags = curriculumCourse.subject.tags 
      ? (Array.isArray(curriculumCourse.subject.tags) ? curriculumCourse.subject.tags : [curriculumCourse.subject.tags])
      : [];
    
    const recommendations = await FacultyRecommendationService.getFacultyRecommendationsForSubject(
      subjectTags,
      department as string
    );

    res.status(200).json({
      curriculumCourse: {
        id: curriculumCourse.id,
        code: curriculumCourse.subjectCode,
        name: curriculumCourse.subjectDescription,
        tags: subjectTags,
      },
      recommendations,
    });
  } catch (error: any) {
    console.error("Error getting faculty recommendations for curriculum course:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFacultyRecommendationsForProgram = async (req: Request, res: Response) => {
  try {
    const { programCode, yearLevel } = req.params;
    const { department } = req.query;

    // Get curriculum courses for the program and year level
    const coursesData = await require("../services/curriculum.service").getCurriculumCoursesByProgramandLevel(
      programCode,
      yearLevel
    );

    const allRecommendations: Record<string, any> = {};

    // Process each semester
    for (const [semester, courses] of Object.entries(coursesData)) {
      if (Array.isArray(courses)) {
        allRecommendations[semester] = [];
        
        for (const course of courses) {
          const subjectTags = course.tags 
            ? (Array.isArray(course.tags) ? course.tags : [course.tags])
            : [];
          
          const recommendations = await FacultyRecommendationService.getFacultyRecommendationsForSubject(
            subjectTags,
            department as string
          );

          allRecommendations[semester].push({
            course: {
              id: course.id,
              code: course.code,
              name: course.name,
              tags: subjectTags,
            },
            recommendations,
          });
        }
      }
    }

    res.status(200).json({
      program: programCode,
      yearLevel,
      recommendations: allRecommendations,
    });
  } catch (error: any) {
    console.error("Error getting faculty recommendations for program:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};