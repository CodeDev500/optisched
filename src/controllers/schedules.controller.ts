import { Request, Response } from "express";
import { db } from "../utils/db.server";

// Get all schedules for Registrar view
export const getAllSchedules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const schedules = await db.subjectSchedule.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { program: 'asc' },
        { yearLevel: 'asc' },
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Map to expected format
    const formattedSchedules = schedules.map((schedule: any) => ({
      id: schedule.id,
      subjectCode: schedule.subjectCode || '',
      subjectDescription: schedule.subjectName || '',
      units: schedule.units || 0,
      time: schedule.time || `${schedule.startTime}-${schedule.endTime}`,
      day: schedule.day || '',
      roomNo: schedule.roomName || '',
      students: schedule.students || '0/50',
      instructor: schedule.facultyName || 'TBA',
      program: schedule.program || '',
      yearLevel: schedule.yearLevel || '',
      semester: schedule.semester || '',
      academicYear: schedule.academicYear || ''
    }));

    res.status(200).json({
      success: true,
      data: formattedSchedules
    });
  } catch (error) {
    console.error("Error fetching all schedules:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all schedules"
    });
  }
};

// Get latest subject schedules (all active schedules)
export const getLatestSchedules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const scheduleItems = await db.subjectSchedule.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.status(200).json({
      success: true,
      scheduleItems
    });
  } catch (error) {
    console.error("Error fetching latest schedules:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest schedules"
    });
  }
};

// Get all subjects with their schedules filtered by program, year level, and semester
export const getSubjectsWithSchedules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { programCode, yearLevel, semester } = req.params;
    console.log(programCode, yearLevel, semester)
    
    // Get curriculum courses with their course offerings and room schedules
    const subjects = await db.curriculumCourse.findMany({
      where: {
        programCode,
        yearLevel,
        period: semester, // semester filter
      },
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

    // Transform the data to include schedule information
    const transformedSubjects = subjects.map((subject) => {
      const schedules = subject.courseOfferings.flatMap((offering) =>
        offering.roomSchedules.map((schedule) => ({
          id: schedule.id,
          day: schedule.day,
          timeStarts: schedule.timeStarts,
          timeEnds: schedule.timeEnds,
          room: schedule.room,
          instructor: schedule.instructor
            ? {
                id: schedule.instructor.id,
                name: `${schedule.instructor.firstname} ${schedule.instructor.lastname}`,
                email: schedule.instructor.email,
              }
            : null,
  
          isLoaded: schedule.isLoaded,
          offeringId: offering.id,
          sectionName: offering.sectionName,
        }))
      );

      return {
        id: subject.id,
        subjectCode: subject.subjectCode,
        subjectDescription: subject.subjectDescription,
        lec: subject.lec,
        lab: subject.lab,
        units: subject.units,
        hours: subject.hours,
        period: subject.period,
        yearLevel: subject.yearLevel,
        programCode: subject.programCode,
        programName: subject.programName,
        schedules,
        courseOfferings: subject.courseOfferings.map((offering) => ({
          id: offering.id,
          courseType: offering.courseType,
          description: offering.description,
          sectionName: offering.sectionName,
          yearLevel: offering.yearLevel,
        })),
      };
    });

    res.status(200).json(transformedSubjects);
  } catch (error) {
    console.error("Error fetching subjects with schedules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Update an existing schedule
export const updateSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      day,
      timeStarts,
      timeEnds,
      room,
      instructorId,
      isLoaded,
    } = req.body;

    // Check if schedule exists
    const existingSchedule = await db.roomSchedules.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSchedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }

    // Update the schedule
    const updatedSchedule = await db.roomSchedules.update({
      where: { id: parseInt(id) },
      data: {
        ...(day && { day }),
        ...(timeStarts && { timeStarts }),
        ...(timeEnds && { timeEnds }),
        ...(room !== undefined && { room }),
        ...(instructorId !== undefined && { instructorId }),

        ...(isLoaded !== undefined && { isLoaded }),
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        courseOffering: {
          include: {
            curriculumCourse: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Schedule updated successfully",
      schedule: {
        id: updatedSchedule.id,
        day: updatedSchedule.day,
        timeStarts: updatedSchedule.timeStarts,
        timeEnds: updatedSchedule.timeEnds,
        room: updatedSchedule.room,
        instructor: updatedSchedule.instructor
          ? {
              id: updatedSchedule.instructor.id,
              name: `${updatedSchedule.instructor.firstname} ${updatedSchedule.instructor.lastname}`,
              email: updatedSchedule.instructor.email,
            }
          : null,

        isLoaded: updatedSchedule.isLoaded,
        offeringId: updatedSchedule.offeringId,
        subject: {
          id: updatedSchedule.courseOffering?.curriculumCourse?.id,
          subjectCode: updatedSchedule.courseOffering?.curriculumCourse?.subjectCode,
          subjectDescription: updatedSchedule.courseOffering?.curriculumCourse?.subjectDescription,
        },
      },
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a schedule
export const deleteSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const scheduleId = parseInt(id);

    if (isNaN(scheduleId)) {
      res.status(400).json({ message: "Invalid schedule ID" });
      return;
    }

    // Check if schedule exists
    const existingSchedule = await db.roomSchedules.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      res.status(404).json({ message: "Schedule not found" });
      return;
    }

    // Delete the schedule
    await db.roomSchedules.delete({
      where: { id: scheduleId },
    });

    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new schedule for a subject
export const createSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      curriculumCourseId,
      offeringId,
      day,
      timeStarts,
      timeEnds,
      room,
      instructorId,
      isLoaded = 0,
    } = req.body;

    // Validate required fields
    if (!curriculumCourseId || !day || !timeStarts || !timeEnds) {
      res.status(400).json({
        message: "curriculumCourseId, day, timeStarts, and timeEnds are required",
      });
      return;
    }

    // Check if curriculum course exists
    const curriculumCourse = await db.curriculumCourse.findUnique({
      where: { id: curriculumCourseId },
    });

    if (!curriculumCourse) {
      res.status(404).json({ message: "Curriculum course not found" });
      return;
    }

    let courseOfferingId = offeringId;

    // If no offering ID provided, create a default course offering
    if (!courseOfferingId) {
      const courseOffering = await db.courseOffering.create({
        data: {
          curriculumId: curriculumCourseId,
          courseType: "Regular",
          description: curriculumCourse.subjectDescription || "",
          sectionName: "A", // Default section
          yearLevel: curriculumCourse.yearLevel || "1",
        },
      });
      courseOfferingId = courseOffering.id;
    }

    // Create the room schedule
    const schedule = await db.roomSchedules.create({
      data: {
        day,
        timeStarts,
        timeEnds,
        room,
        offeringId: courseOfferingId,
        instructorId,
        isLoaded,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        courseOffering: {
          include: {
            curriculumCourse: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: {
        id: schedule.id,
        day: schedule.day,
        timeStarts: schedule.timeStarts,
        timeEnds: schedule.timeEnds,
        room: schedule.room,
        instructor: schedule.instructor
          ? {
              id: schedule.instructor.id,
              name: `${schedule.instructor.firstname} ${schedule.instructor.lastname}`,
              email: schedule.instructor.email,
            }
          : null,

        isLoaded: schedule.isLoaded,
        offeringId: schedule.offeringId,
        subject: {
          id: schedule.courseOffering?.curriculumCourse?.id,
          subjectCode: schedule.courseOffering?.curriculumCourse?.subjectCode,
          subjectDescription: schedule.courseOffering?.curriculumCourse?.subjectDescription,
        },
      },
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all subjects by program and year level (without semester filter)
export const getSubjectsByProgramAndYear = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { programCode, yearLevel } = req.params;
    console.log(programCode, yearLevel);
    
    // Get curriculum courses for the specified program and year level
    const subjects = await db.curriculumCourse.findMany({
      where: {
        programCode,
        yearLevel,
      },
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

    // Transform the data to include schedule information
    const transformedSubjects = subjects.map((subject) => {
      const schedules = subject.courseOfferings.flatMap((offering) =>
        offering.roomSchedules.map((schedule) => ({
          id: schedule.id,
          day: schedule.day,
          timeStarts: schedule.timeStarts,
          timeEnds: schedule.timeEnds,
          room: schedule.room,
          instructor: schedule.instructor
            ? {
                id: schedule.instructor.id,
                name: `${schedule.instructor.firstname} ${schedule.instructor.lastname}`,
                email: schedule.instructor.email,
              }
            : null,

          isLoaded: schedule.isLoaded,
          offeringId: offering.id,
          sectionName: offering.sectionName,
        }))
      );

      return {
        id: subject.id,
        subjectCode: subject.subjectCode,
        subjectDescription: subject.subjectDescription,
        lec: subject.lec,
        lab: subject.lab,
        units: subject.units,
        hours: subject.hours,
        period: subject.period,
        yearLevel: subject.yearLevel,
        programCode: subject.programCode,
        programName: subject.programName,
        schedules,
        courseOfferings: subject.courseOfferings.map((offering) => ({
          id: offering.id,
          courseType: offering.courseType,
          description: offering.description,
          sectionName: offering.sectionName,
          yearLevel: offering.yearLevel,
        })),
      };
    });

    res.status(200).json(transformedSubjects);
  } catch (error) {
    console.error("Error fetching subjects by program and year:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all instructors for assignment
export const getInstructors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const instructors = await db.user.findMany({
      where: {
        role: "FACULTY",
        status: "APPROVED",
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        department: true,
        specialization: true,
      },
    });

    const transformedInstructors = instructors.map((instructor) => ({
      id: instructor.id,
      name: `${instructor.firstname} ${instructor.lastname}`,
      email: instructor.email,
      department: instructor.department,
    }));

    res.status(200).json(transformedInstructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Submit schedules for approval
export const submitForApproval = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { academicYear, programCode, yearLevel, semester, subjects } = req.body;
    
    // Validate required fields
    if (!academicYear || !programCode || !yearLevel || !semester || !subjects) {
      res.status(400).json({ 
        message: "Missing required fields: academicYear, programCode, yearLevel, semester, subjects" 
      });
      return;
    }
    
    // Log the submission data for debugging
    console.log('Schedule submission received:', {
      academicYear,
      programCode,
      yearLevel,
      semester,
      subjectsCount: subjects.length,
      subjects: subjects.map((s: any) => ({
        id: s.id,
        subjectCode: s.subjectCode,
        hasScheduleData: !!s.scheduleData,
        scheduleDays: s.scheduleData?.days?.length || 0
      }))
    });
    
    const savedSchedules = [];
    
    // Process each subject and save schedules
    for (const subject of subjects) {
      const { scheduleData } = subject;
      
      if (scheduleData && scheduleData.days && scheduleData.days.length > 0) {
        // Find or create course offering for this subject
        let courseOffering = await db.courseOffering.findFirst({
          where: {
            curriculumCourse: {
              id: subject.id
            }
          }
        });
        
        if (!courseOffering) {
          // Create a course offering if it doesn't exist
          courseOffering = await db.courseOffering.create({
            data: {
              curriculumId: subject.id,
              courseType: "Regular",
              description: subject.subjectDescription || "",
              sectionName: "A", // Default section
              yearLevel: yearLevel,
            }
          });
        }
        
        // Find instructor ID if instructor name is provided
        let instructorId = null;
        if (scheduleData.instructor) {
          const instructor = await db.user.findFirst({
            where: {
              OR: [
                { firstname: { contains: scheduleData.instructor } },
                { lastname: { contains: scheduleData.instructor } },
                { email: scheduleData.instructor }
              ]
            }
          });
          instructorId = instructor?.id || null;
        }
        
        // Create schedule entries for each day
        for (const day of scheduleData.days) {
          const schedule = await db.roomSchedules.create({
            data: {
              day: day,
              timeStarts: scheduleData.startTime || "08:00",
              timeEnds: scheduleData.endTime || "09:00",
              room: scheduleData.room || null,
              offeringId: courseOffering.id,
              instructorId: instructorId,
              isLoaded: 0
            }
          });
          
          savedSchedules.push({
            scheduleId: schedule.id,
            subjectCode: subject.subjectCode,
            day: day,
            time: `${scheduleData.startTime} - ${scheduleData.endTime}`,
            room: scheduleData.room,
            instructor: scheduleData.instructor
          });
        }
      }
    }
    
    res.status(200).json({
      message: "Schedule submitted and saved successfully",
      submissionId: `SUB-${Date.now()}`,
      status: "SAVED",
      data: {
        academicYear,
        programCode,
        yearLevel,
        semester,
        subjectsProcessed: subjects.length,
        schedulesCreated: savedSchedules.length,
        savedSchedules: savedSchedules
      }
    });
    return;
    
  } catch (error) {
    console.error('Error submitting schedule for approval:', error);
    res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' });
    return;
  }
};