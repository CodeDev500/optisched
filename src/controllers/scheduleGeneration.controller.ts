import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../constants/constants';
import * as UserService from "../services/user.service";

const prisma = new PrismaClient();

// ===============================
// 📅 SCHEDULING CONSTANTS
// ===============================

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Preferred day pairs for lectures
const LECTURE_DAY_PAIRS = [
  ["Monday", "Wednesday"],
  ["Tuesday", "Thursday"],
  ["Monday", "Friday"],
  ["Wednesday", "Friday"],
  ["Tuesday", "Friday"],
];

// Day pairs for labs (prefer TTh, then others that don't overlap with common lecture days)
const LAB_DAY_PAIRS = [
  ["Tuesday", "Thursday"],
  ["Wednesday", "Friday"],
  ["Monday", "Friday"],
  ["Monday", "Wednesday"],
  ["Tuesday", "Friday"],
];

// Time slots for 1-hour sessions
const TIME_SLOTS_1H = [
  { start: "07:00", end: "08:00" },
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
  { start: "18:00", end: "19:00" },
  { start: "19:00", end: "20:00" },
];

// Time slots for 1.5-hour sessions
const TIME_SLOTS_1_5H = [
  { start: "07:00", end: "08:30" },
  { start: "08:30", end: "10:00" },
  { start: "10:00", end: "11:30" },
  { start: "13:00", end: "14:30" },
  { start: "14:30", end: "16:00" },
  { start: "16:00", end: "17:30" },
  { start: "17:30", end: "19:00" },
  { start: "19:00", end: "20:30" },
];

interface SessionRule {
  type: 'Lecture' | 'Laboratory';
  duration: number;
  totalHoursNeeded: number;
  sessionsPerWeek: number;
  hoursPerSession: number;
  priority: number; // Add priority to schedule lectures before labs
}

// ===============================
// 🧠 SESSION RULES CALCULATION
// ===============================

function calculateSessionRules(lecUnits: number, labUnits: number): SessionRule[] {
  const rules: SessionRule[] = [];

  // LECTURE RULES (Priority 1 - schedule first)
  if (lecUnits > 0) {
    if (lecUnits === 3) {
      rules.push({
        type: 'Lecture',
        duration: 1.5,
        totalHoursNeeded: 3,
        sessionsPerWeek: 2,
        hoursPerSession: 1.5,
        priority: 1
      });
    } else if (lecUnits === 2) {
      rules.push({
        type: 'Lecture',
        duration: 1,
        totalHoursNeeded: 2,
        sessionsPerWeek: 2,
        hoursPerSession: 1,
        priority: 1
      });
    } else if (lecUnits === 1) {
      rules.push({
        type: 'Lecture',
        duration: 1,
        totalHoursNeeded: 1,
        sessionsPerWeek: 1,
        hoursPerSession: 1,
        priority: 1
      });
    } else {
      rules.push({
        type: 'Lecture',
        duration: 1,
        totalHoursNeeded: lecUnits,
        sessionsPerWeek: lecUnits,
        hoursPerSession: 1,
        priority: 1
      });
    }
  }

  // LABORATORY RULES (Priority 2 - schedule after lectures)
  if (labUnits > 0) {
    rules.push({
      type: 'Laboratory',
      duration: 1.5,
      totalHoursNeeded: labUnits * 3,
      sessionsPerWeek: labUnits * 2,
      hoursPerSession: 1.5,
      priority: 2
    });
  }

  // Sort by priority to ensure lectures are scheduled before labs
  return rules.sort((a, b) => a.priority - b.priority);
}

// ===============================
// 🔧 HELPER FUNCTIONS
// ===============================

function parseJsonArray(jsonString: any): string[] {
  if (Array.isArray(jsonString)) return jsonString;
  if (!jsonString || typeof jsonString !== 'string') return [];
  if (jsonString.includes(',') && !jsonString.trim().startsWith('[')) {
    return jsonString.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [parsed.toString()];
  } catch {
    return [jsonString.trim()];
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  return start1Min < end2Min && start2Min < end1Min;
}

function isValidTimeSlot(startTime: string, endTime: string): boolean {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const lunchStart = timeToMinutes('12:00');
  const lunchEnd = timeToMinutes('13:00');
  
  const overlapsLunch = startMin < lunchEnd && endMin > lunchStart;
  const validStart = startMin >= timeToMinutes('07:00');
  const validEnd = endMin <= timeToMinutes('20:00');
  
  return !overlapsLunch && validStart && validEnd && endMin > startMin;
}

function calculateFacultyMatchScore(courseTags: string[], facultySpecializations: string[]): number {
  if (!courseTags || courseTags.length === 0 || !facultySpecializations || facultySpecializations.length === 0) {
    return 0;
  }

  const normalizedCourseTags = courseTags.map(tag => tag.toLowerCase().trim());
  const normalizedSpecializations = facultySpecializations.map(spec => spec.toLowerCase().trim());

  let matchedTagsCount = 0;
  for (const courseTag of normalizedCourseTags) {
    if (normalizedSpecializations.includes(courseTag)) {
      matchedTagsCount++;
    }
  }

  return Math.round((matchedTagsCount / normalizedCourseTags.length) * 100);
}

function calculateEnhancedFacultyScore(
  course: any,
  faculty: any,
  courseTags: string[],
  facultySpecializations: string[],
  currentWorkload: number,
  maxUnits: number = 18
): number {
  let score = 0;
  
  const tagMatchPercentage = calculateFacultyMatchScore(courseTags, facultySpecializations);
  score += tagMatchPercentage;
  
  const previousSubjects = parseJsonArray(faculty.previousSubjects || []);
  const hasTaughtSubject = previousSubjects.some((prevSubj: string) => 
    prevSubj.toLowerCase().trim() === course.subjectCode.toLowerCase().trim() ||
    prevSubj.toLowerCase().trim() === course.subjectName.toLowerCase().trim()
  );
  if (hasTaughtSubject) score += 50;
  
  const experience = faculty.yearsOfExperience || 0;
  score += Math.min(experience, 20);
  
  const isRegularFaculty = faculty.designation && faculty.designation.toLowerCase().includes('regular');
  if (isRegularFaculty) score += 10;
  
  if (currentWorkload >= maxUnits) score = -1000;
  
  return score;
}

function findBestFacultyMatches(
  course: any, 
  instructors: any[], 
  facultyWorkload: Map<string, number>,
  maxMatches: number = 5,
  maxUnits: number = 18
): any[] {
  const courseTags = parseJsonArray(course.tags);
  
  const facultyWithScores = instructors.map(instructor => {
    const specialization = instructor.specialization || instructor.designation || '';
    const facultySpecializations = parseJsonArray(specialization);
    const currentLoad = facultyWorkload.get(instructor.id.toString()) || 0;
    
    const enhancedScore = calculateEnhancedFacultyScore(
      course,
      instructor,
      courseTags,
      facultySpecializations,
      currentLoad,
      maxUnits
    );
    
    const tagMatchPercentage = calculateFacultyMatchScore(courseTags, facultySpecializations);
    
    return {
      ...instructor,
      matchScore: enhancedScore,
      tagMatchPercentage: tagMatchPercentage,
      currentWorkload: currentLoad
    };
  });

  const sortedFaculty = facultyWithScores.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.tagMatchPercentage !== a.tagMatchPercentage) return b.tagMatchPercentage - a.tagMatchPercentage;
    const aExp = a.yearsOfExperience || 0;
    const bExp = b.yearsOfExperience || 0;
    if (bExp !== aExp) return bExp - aExp;
    return a.lastname.localeCompare(b.lastname);
  });
  
  const rankedFaculty = sortedFaculty.map((faculty, index) => ({
    ...faculty,
    rank: index + 1
  }));
  
  const goodMatches = rankedFaculty.filter(f => f.matchScore > 0);
  
  if (goodMatches.length >= maxMatches) {
    return goodMatches.slice(0, maxMatches);
  }
  
  const fallbackFaculty = rankedFaculty.filter(f => f.matchScore <= 0).slice(0, maxMatches - goodMatches.length);
  return [...goodMatches, ...fallbackFaculty];
}

// ===============================
// 🎯 MAIN SCHEDULING LOGIC
// ===============================

interface ScheduledSession {
  day: string;
  startTime: string;
  endTime: string;
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
}

/**
 * Check if a room is available at a specific time
 */
function isRoomAvailable(
  roomId: string,
  days: string[],
  startTime: string,
  endTime: string,
  semester: string,
  usedRooms: Map<string, Set<string>>
): boolean {
  const roomSlots = usedRooms.get(roomId) || new Set();
  
  for (const day of days) {
    for (const existingSlot of roomSlots) {
      const [existingSem, existingDay, existingStart, existingEnd] = existingSlot.split('|');
      
      if (existingSem === semester && existingDay === day) {
        if (timeRangesOverlap(startTime, endTime, existingStart, existingEnd)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Check if faculty is available at a specific time (includes 30-min break check)
 */
function isFacultyAvailable(
  facultyId: string,
  days: string[],
  startTime: string,
  endTime: string,
  semester: string,
  usedSlots: Map<string, Set<string>>
): boolean {
  const facultySlots = usedSlots.get(facultyId) || new Set();
  
  for (const day of days) {
    for (const existingSlot of facultySlots) {
      const [existingSem, existingDay, existingStart, existingEnd] = existingSlot.split('|');
      
      if (existingSem === semester && existingDay === day) {
        // Check for direct overlap
        if (timeRangesOverlap(startTime, endTime, existingStart, existingEnd)) {
          return false;
        }
        
        // Check for 30-minute break requirement
        const currentStartMin = timeToMinutes(startTime);
        const currentEndMin = timeToMinutes(endTime);
        const existingStartMin = timeToMinutes(existingStart);
        const existingEndMin = timeToMinutes(existingEnd);
        
        // New class starts too soon after existing class ends (need 30-min break)
        // CRITICAL: Use >= for same-day classes (back-to-back needs break on same day)
        if (currentStartMin >= existingEndMin && currentStartMin < existingEndMin + 30) {
          console.log(`      ⏰ Break violation: Class at ${startTime} starts only ${currentStartMin - existingEndMin} mins after class ending at ${existingEnd} on ${day}`);
          return false;
        }
        
        // Existing class starts too soon after new class ends (need 30-min break)
        if (existingStartMin >= currentEndMin && existingStartMin < currentEndMin + 30) {
          console.log(`      ⏰ Break violation: Class at ${existingStart} starts only ${existingStartMin - currentEndMin} mins after class ending at ${endTime} on ${day}`);
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Schedule sessions with proper conflict detection
 */
function scheduleSubjectSessions(
  course: any,
  sessionRule: SessionRule,
  instructors: any[],
  rooms: any[],
  facultyWorkload: Map<string, number>,
  usedSlots: Map<string, Set<string>>,
  usedRooms: Map<string, Set<string>>,
  usedProgramYearSlots: Map<string, Set<string>>,
  scheduledSubjects: any[],
  semester: string,
  maxUnits: number,
  usedDayPairsForSubject: Map<string, string[]>
): ScheduledSession[] {
  
  const sessions: ScheduledSession[] = [];
  const { type, sessionsPerWeek, hoursPerSession } = sessionRule;
  
  console.log(`\n📚 Scheduling ${type} for ${course.subjectCode}: ${sessionsPerWeek} sessions × ${hoursPerSession}h`);
  
  const timeSlots = hoursPerSession === 1 ? TIME_SLOTS_1H : TIME_SLOTS_1_5H;
  const durationMinutes = hoursPerSession * 60;
  const programYearKey = `${course.programCode}_${course.yearLevel}_${semester}`;
  
  const subjectKey = `${course.subjectCode}_${semester}`;
  const alreadyUsedDays = usedDayPairsForSubject.get(subjectKey) || [];
  
  // Choose day pairs based on session type and avoid already used days
  let dayPairsToTry = type === 'Laboratory' ? [...LAB_DAY_PAIRS] : [...LECTURE_DAY_PAIRS];
  
  dayPairsToTry = dayPairsToTry.filter(pair => {
    return !pair.some(day => alreadyUsedDays.includes(day));
  });
  
  if (dayPairsToTry.length === 0) {
    console.error(`   ❌ No available day pairs for ${type}`);
    return sessions;
  }
  
  const needsPairing = sessionsPerWeek === 2;
  
  if (needsPairing) {
    console.log(`   🔗 Scheduling paired sessions (same time, different days)`);
    
    let scheduledPair = false;
    
    for (const dayPair of dayPairsToTry) {
      if (scheduledPair) break;
      
      const [day1, day2] = dayPair;
      console.log(`   📅 Trying: ${day1} & ${day2}`);
      
      for (const slot of timeSlots) {
        if (scheduledPair) break;
        
        const startTime = slot.start;
        const endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes);
        
        if (!isValidTimeSlot(startTime, endTime)) continue;
        
        console.log(`      ⏰ Trying: ${startTime}-${endTime}`);
        
        // Check program-year conflicts
        const programYearSlots = usedProgramYearSlots.get(programYearKey) || new Set();
        const slot1Key = `${day1}|${startTime}|${endTime}`;
        const slot2Key = `${day2}|${startTime}|${endTime}`;
        
        if (programYearSlots.has(slot1Key) || programYearSlots.has(slot2Key)) {
          console.log(`      ⚠️ Program-year conflict`);
          continue;
        }
        
        // CRITICAL: Check for ANY overlap with program-year slots (not just exact match)
        let hasProgramYearOverlap = false;
        for (const existingSlot of programYearSlots) {
          const [existingDay, existingStart, existingEnd] = existingSlot.split('|');
          
          // Check day1
          if (existingDay === day1 && timeRangesOverlap(startTime, endTime, existingStart, existingEnd)) {
            console.log(`      ⚠️ Program-year overlap on ${day1}: ${startTime}-${endTime} overlaps ${existingStart}-${existingEnd}`);
            hasProgramYearOverlap = true;
            break;
          }
          
          // Check day2
          if (existingDay === day2 && timeRangesOverlap(startTime, endTime, existingStart, existingEnd)) {
            console.log(`      ⚠️ Program-year overlap on ${day2}: ${startTime}-${endTime} overlaps ${existingStart}-${existingEnd}`);
            hasProgramYearOverlap = true;
            break;
          }
        }
        
        if (hasProgramYearOverlap) {
          continue;
        }
        
        const recommendedFaculty = course.recommendedFaculty || instructors;
        
        for (const faculty of recommendedFaculty) {
          if (scheduledPair) break;
          
          const facultyId = faculty.id.toString();
          const currentWorkload = facultyWorkload.get(facultyId) || 0;
          
          const alreadyTeaching = scheduledSubjects.some(s => 
            s.subjectCode === course.subjectCode && s.facultyId === facultyId && s.semester === semester
          );
          
          if (!alreadyTeaching && currentWorkload + (course.units || 0) > maxUnits) {
            continue;
          }
          
          // Check faculty availability
          if (!isFacultyAvailable(facultyId, [day1, day2], startTime, endTime, semester, usedSlots)) {
            continue;
          }
          
          // Try to find available room
          const roomCandidates = type === 'Laboratory' 
            ? rooms.filter(r => r.name.toLowerCase().includes('lab'))
            : rooms.filter(r => !r.name.toLowerCase().includes('lab'));
          
          const allRooms = roomCandidates.length > 0 ? roomCandidates : rooms;
          
          for (const room of allRooms) {
            if (scheduledPair) break;
            
            const roomId = room.id.toString();
            
            // CRITICAL: Check room availability for BOTH days
            if (!isRoomAvailable(roomId, [day1, day2], startTime, endTime, semester, usedRooms)) {
              continue;
            }
            
            // SUCCESS! Book both sessions
            console.log(`      ✅ PAIRED: ${day1} & ${day2} at ${startTime}-${endTime}, Room: ${room.name}`);
            
            sessions.push({
              day: day1,
              startTime,
              endTime,
              facultyId,
              facultyName: `${faculty.firstname} ${faculty.lastname}`,
              roomId,
              roomName: room.name
            });
            
            sessions.push({
              day: day2,
              startTime,
              endTime,
              facultyId,
              facultyName: `${faculty.firstname} ${faculty.lastname}`,
              roomId,
              roomName: room.name
            });
            
            // Mark slots as used
            if (!usedSlots.has(facultyId)) usedSlots.set(facultyId, new Set());
            usedSlots.get(facultyId)!.add(`${semester}|${day1}|${startTime}|${endTime}`);
            usedSlots.get(facultyId)!.add(`${semester}|${day2}|${startTime}|${endTime}`);
            
            if (!usedRooms.has(roomId)) usedRooms.set(roomId, new Set());
            usedRooms.get(roomId)!.add(`${semester}|${day1}|${startTime}|${endTime}`);
            usedRooms.get(roomId)!.add(`${semester}|${day2}|${startTime}|${endTime}`);
            
            if (!usedProgramYearSlots.has(programYearKey)) {
              usedProgramYearSlots.set(programYearKey, new Set());
            }
            usedProgramYearSlots.get(programYearKey)!.add(slot1Key);
            usedProgramYearSlots.get(programYearKey)!.add(slot2Key);
            
            // Track used days for this subject
            if (!usedDayPairsForSubject.has(subjectKey)) {
              usedDayPairsForSubject.set(subjectKey, []);
            }
            usedDayPairsForSubject.get(subjectKey)!.push(day1, day2);
            
            // Update workload
            if (!alreadyTeaching) {
              facultyWorkload.set(facultyId, currentWorkload + (course.units || 0));
              console.log(`      💼 ${faculty.firstname} workload: ${currentWorkload} → ${currentWorkload + (course.units || 0)}`);
            }
            
            scheduledPair = true;
          }
        }
      }
    }
    
    if (!scheduledPair) {
      console.error(`   ❌ FAILED to schedule ${course.subjectCode} ${type}`);
    }
    
  } else {
    // Single session scheduling (similar logic with single day)
    console.log(`   📍 Scheduling single session`);
    // ... (implement single session logic if needed for 1-unit subjects)
  }
  
  return sessions;
}

export const generateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { curriculumYear, semester } = req.query as Record<string, string | undefined>;

    if (!curriculumYear || !semester) {
      res.status(400).json({ 
        success: false, 
        message: 'Curriculum year and semester are required.' 
      });
      return;
    }

    const instructors = await UserService.getInstructors();
    const rooms = await prisma.room.findMany();
    const curriculumCourses = await prisma.curriculumCourse.findMany({
      where: { curriculumYear, period: semester }
    });

    if (!curriculumCourses || curriculumCourses.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: `No subjects found for ${curriculumYear} - ${semester}` 
      });
      return;
    }

    console.log(`✅ Found ${curriculumCourses.length} courses`);

    const totalUnitsConfig = await prisma.totalUnits.findFirst();
    const maxUnits = totalUnitsConfig?.totalUnits || 18;

    const facultyWorkload = new Map<string, number>();
    const usedSlots = new Map<string, Set<string>>();
    const usedRooms = new Map<string, Set<string>>();
    const usedProgramYearSlots = new Map<string, Set<string>>();
    const usedDayPairsForSubject = new Map<string, string[]>();
    const scheduledSubjects: any[] = [];

    const subjectsWithData = await Promise.all(
      curriculumCourses.map(async (course) => {
        const subject = await prisma.subject.findUnique({
          where: { subjectCode: course.subjectCode || '' },
          select: { tags: true }
        });
        
        const courseWithTags = { ...course, tags: subject?.tags || null };
        const recommendedFaculty = findBestFacultyMatches(courseWithTags, instructors, facultyWorkload, 5, maxUnits);

        return { ...courseWithTags, recommendedFaculty };
      })
    );

    // Process each course
    for (const course of subjectsWithData) {
      const lecUnits = course.lec || 0;
      const labUnits = course.lab || 0;
      
      const sessionRules = calculateSessionRules(lecUnits, labUnits);
      
      console.log(`\n📖 ${course.subjectCode}: Lec=${lecUnits}u, Lab=${labUnits}u`);
      
      // Schedule lectures FIRST, then labs (due to priority sorting)
      for (const rule of sessionRules) {
        const sessions = scheduleSubjectSessions(
          course,
          rule,
          instructors,
          rooms,
          facultyWorkload,
          usedSlots,
          usedRooms,
          usedProgramYearSlots,
          scheduledSubjects,
          semester,
          maxUnits,
          usedDayPairsForSubject
        );
        
        // Add sessions to scheduled subjects
        sessions.forEach((session, index) => {
          scheduledSubjects.push({
            id: `${course.id}-${rule.type.toLowerCase()}-${session.day}`,
            subjectId: course.id.toString(),
            subjectCode: course.subjectCode || '',
            subjectName: course.subjectDescription || '',
            facultyId: session.facultyId,
            facultyName: session.facultyName,
            roomId: session.roomId,
            roomName: session.roomName,
            day: session.day,
            startTime: session.startTime,
            endTime: session.endTime,
            units: course.units || 3,
            lec: lecUnits,
            lab: labUnits,
            yearLevel: course.yearLevel,
            semester: semester,
            program: course.programCode || course.programName,
            type: rule.type,
            sessionPriority: rule.priority,
            recommendedFaculty: course.recommendedFaculty || [],
            hasConflict: false,
            conflictType: 'none',
            status: 'conflict-free',
            // CRITICAL: Add curriculum year for save functionality
            curriculumYear: curriculumYear,
            academicYear: curriculumYear
          });
        });
      }
    }

    // Sort scheduledSubjects to ensure Lectures come before Labs for each subject
    const sortedScheduledSubjects = scheduledSubjects.sort((a, b) => {
      // First, sort by subject code (alphabetical)
      const subjectCompare = a.subjectCode.localeCompare(b.subjectCode);
      if (subjectCompare !== 0) return subjectCompare;
      
      // Same subject: sort by program
      const programCompare = (a.program || '').localeCompare(b.program || '');
      if (programCompare !== 0) return programCompare;
      
      // Same program: sort by year level
      const yearCompare = (a.yearLevel || '').localeCompare(b.yearLevel || '');
      if (yearCompare !== 0) return yearCompare;
      
      // Same year: sort by semester
      const semesterCompare = (a.semester || '').localeCompare(b.semester || '');
      if (semesterCompare !== 0) return semesterCompare;
      
      // CRITICAL: Same subject - Lecture MUST come before Laboratory
      if (a.type !== b.type) {
        // Lecture = priority 1, Laboratory = priority 2
        const typeOrder: { [key: string]: number } = { 'Lecture': 1, 'Laboratory': 2 };
        return (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3);
      }
      
      // Same type: sort by day of week (Monday first)
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const aDayIndex = dayOrder.indexOf(a.day);
      const bDayIndex = dayOrder.indexOf(b.day);
      
      if (aDayIndex !== bDayIndex) {
        return aDayIndex - bDayIndex;
      }
      
      // Same day: sort by start time
      return a.startTime.localeCompare(b.startTime);
    });

    console.log('\n📋 Final Schedule Order (First 5 entries):');
    sortedScheduledSubjects.slice(0, 5).forEach(s => {
      console.log(`   ${s.subjectCode} - ${s.type}: ${s.day} ${s.startTime}-${s.endTime}`);
    });
    
    // VALIDATION SUMMARY
    console.log('\n🔍 VALIDATION SUMMARY:');
    console.log('=' .repeat(60));
    
    // Group by subject to validate hours
    const subjectGroups = sortedScheduledSubjects.reduce((acc: any, s: any) => {
      const key = `${s.subjectCode}_${s.program}_${s.yearLevel}`;
      if (!acc[key]) {
        acc[key] = { 
          subjectCode: s.subjectCode, 
          lec: s.lec, 
          lab: s.lab, 
          program: s.program,
          yearLevel: s.yearLevel,
          sessions: [] 
        };
      }
      acc[key].sessions.push(s);
      return acc;
    }, {});
    
    let totalErrors = 0;
    let totalWarnings = 0;
    
    console.log('\n📚 SUBJECT BREAKDOWN:');
    Object.values(subjectGroups).forEach((group: any) => {
      const expectedHours = (group.lec * 1) + (group.lab * 3);
      const actualHours = group.sessions.reduce((sum: number, s: any) => {
        const duration = (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60;
        return sum + duration;
      }, 0);
      
      const lectureCount = group.sessions.filter((s: any) => s.type === 'Lecture').length;
      const labCount = group.sessions.filter((s: any) => s.type === 'Laboratory').length;
      
      console.log(`\n   ${group.subjectCode} (${group.program} ${group.yearLevel}):`);
      console.log(`      Units: Lec=${group.lec}, Lab=${group.lab}`);
      console.log(`      Expected: ${expectedHours}h/week | Actual: ${actualHours}h/week`);
      console.log(`      Sessions: ${lectureCount} Lecture + ${labCount} Lab`);
      
      // List all sessions
      const lectures = group.sessions.filter((s: any) => s.type === 'Lecture');
      const labs = group.sessions.filter((s: any) => s.type === 'Laboratory');
      
      if (lectures.length > 0) {
        console.log(`      Lectures:`);
        lectures.forEach((s: any) => {
          console.log(`         - ${s.day} ${s.startTime}-${s.endTime} (${s.roomName})`);
        });
      }
      
      if (labs.length > 0) {
        console.log(`      Labs:`);
        labs.forEach((s: any) => {
          console.log(`         - ${s.day} ${s.startTime}-${s.endTime} (${s.roomName})`);
        });
      }
      
      // Validation
      if (Math.abs(expectedHours - actualHours) > 0.1) {
        console.error(`      ❌ ERROR: Hours mismatch!`);
        totalErrors++;
      } else if (lectureCount > 0 && lectureCount !== 2 && group.lec >= 2) {
        console.warn(`      ⚠️ WARNING: Expected 2 lecture sessions, got ${lectureCount}`);
        totalWarnings++;
      } else {
        console.log(`      ✅ Valid`);
      }
    });
    
    // Check for cohort conflicts
    console.log('\n🎓 COHORT CONFLICT CHECK:');
    const cohortSchedules = sortedScheduledSubjects.reduce((acc: any, s: any) => {
      const cohortKey = `${s.program}_${s.yearLevel}_${s.semester}`;
      if (!acc[cohortKey]) acc[cohortKey] = [];
      acc[cohortKey].push(s);
      return acc;
    }, {});
    
    Object.entries(cohortSchedules).forEach(([cohort, sessions]: [string, any]) => {
      const conflicts: any[] = [];
      
      for (let i = 0; i < sessions.length; i++) {
        for (let j = i + 1; j < sessions.length; j++) {
          const s1 = sessions[i];
          const s2 = sessions[j];
          
          if (s1.day === s2.day && timeRangesOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            conflicts.push(`${s1.subjectCode} vs ${s2.subjectCode} on ${s1.day} (${s1.startTime}-${s1.endTime} overlaps ${s2.startTime}-${s2.endTime})`);
          }
        }
      }
      
      if (conflicts.length > 0) {
        console.error(`   ❌ ${cohort}: ${conflicts.length} conflicts`);
        conflicts.forEach(c => console.error(`      - ${c}`));
        totalErrors += conflicts.length;
      } else {
        console.log(`   ✅ ${cohort}: No conflicts`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    if (totalErrors > 0) {
      console.error(`❌ VALIDATION FAILED: ${totalErrors} errors found`);
    } else {
      console.log(`✅ VALIDATION PASSED: All checks successful`);
    }
    console.log('='.repeat(60) + '\n');

    const generatedSchedule = {
      id: Date.now().toString(),
      name: `Schedule 1`,
      createdAt: new Date(),
      conflicts: [],
      subjects: sortedScheduledSubjects,
      totalSubjects: sortedScheduledSubjects.length,
      totalFaculty: instructors.length,
      faculty: [...new Set(sortedScheduledSubjects.map((s: any) => s.facultyName))],
      optimizationScore: totalErrors === 0 ? 100 : Math.max(0, 100 - (totalErrors * 5))
    };

    res.json({ success: true, data: [generatedSchedule] });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to generate schedule' });
  }
};

// Keep other functions as-is
export const updateScheduleData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduleData, notes } = req.body;

    const generation = await prisma.scheduleGeneration.update({
      where: { id: parseInt(id) },
      data: {
        scheduleData: JSON.stringify(scheduleData),
        notes
      }
    });

    res.json({ success: true, data: generation });
  } catch (error) {
    console.error('Error updating schedule data:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule data' });
  }
};

export const resolveConflict = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const conflict = await prisma.scheduleConflict.update({
      where: { id: parseInt(id) },
      data: {
        isResolved: true,
        resolution
      }
    });

    res.json({ success: true, data: conflict });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve conflict' });
  }
};

export const saveLatestSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const isArrayBody = Array.isArray(req.body);

    const subjects: any[] = isArrayBody
      ? (req.body as any[])
      : Array.isArray((req.body as any)?.schedules)
        ? (req.body as any).schedules
        : Array.isArray((req.body as any)?.scheduleData?.subjects)
          ? (req.body as any).scheduleData.subjects
          : [];

    if (!subjects || subjects.length === 0) {
      res.status(400).json({ success: false, message: 'No schedule items provided' });
      return;
    }

    const curriculumYear = subjects[0]?.curriculumYear || subjects[0]?.academicYear;
    const semester = subjects[0]?.semester;
    
    if (!curriculumYear) {
      res.status(400).json({ success: false, message: 'Curriculum year required' });
      return;
    }

    console.log(`🗑️ Deleting existing schedules for: ${curriculumYear}`);
    
    const deleteResult = await prisma.subjectSchedule.deleteMany({
      where: {
        academicYear: curriculumYear,
        semester: semester
      }
    });
    
    console.log(`✅ Deleted ${deleteResult.count} schedules`);

    await prisma.subjectSchedule.createMany({
      data: subjects.map((item: any) => ({
        sourceId: String(item.id ?? ''),
        subjectId: String(item.subjectId ?? ''),
        subject: String(item.subject ?? item.subjectName ?? ''),
        subjectCode: String(item.subjectCode ?? ''),
        subjectName: String(item.subjectName ?? item.subject ?? ''),
        subjectDescription: item.subjectDescription ?? null,
        faculty: String(item.faculty ?? item.facultyName ?? ''),
        facultyId: String(item.facultyId ?? ''),
        facultyName: String(item.facultyName ?? item.faculty ?? ''),
        room: String(item.room ?? item.roomName ?? ''),
        roomId: String(item.roomId ?? ''),
        roomName: String(item.roomName ?? item.room ?? ''),
        time: String(item.time ?? ''),
        day: String(item.day ?? ''),
        days: item.days ?? null,
        startTime: String(item.startTime ?? ''),
        endTime: String(item.endTime ?? ''),
        semester: String(item.semester ?? ''),
        academicYear: String(item.academicYear ?? ''),
        program: String(item.program ?? ''),
        yearLevel: String(item.yearLevel ?? ''),
        units: Number(item.units ?? 0),
        lec: Number(item.lec ?? 0),
        lab: Number(item.lab ?? 0),
        students: item.students ?? null,
        totalStudents: Number(item.totalStudents ?? 0),
        type: item.type ?? null,
        tags: Array.isArray(item.tags) || typeof item.tags === 'object' ? (item.tags as any) : undefined,
        recommendedFaculty: Array.isArray(item.recommendedFaculty) || typeof item.recommendedFaculty === 'object' ? (item.recommendedFaculty as any) : undefined,
        hasConflict: typeof item.hasConflict === 'boolean' ? item.hasConflict : null,
        status: item.status ?? null,
        conflictType: item.conflictType ?? null,
        department: item.department ?? null,
        curriculumId: item.curriculumId ?? null,
        instructorId: item.instructorId ?? null,
        roomLegacyId: item.roomLegacyId ?? null,
        isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
      })) as any
    });

    res.json({ 
      success: true, 
      message: `Successfully saved ${subjects.length} schedules for ${curriculumYear}`,
      data: { 
        curriculumYear,
        deletedCount: deleteResult.count, 
        insertedCount: subjects.length 
      } 
    });
  } catch (error) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to save schedule' });
  }
};

export const getLatestSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, academicYear, semester, yearLevel } = req.query as Record<string, string | undefined>;

    if (!department) {
      res.status(400).json({ success: false, message: 'department is required' });
      return;
    }

    const where: any = { department };
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;
    if (yearLevel) where.yearLevel = yearLevel;

    const generation = await prisma.scheduleGeneration.findFirst({
      where,
      orderBy: { createdAt: 'desc' }
    });

    if (!generation) {
      res.status(404).json({ success: false, message: 'No saved schedule found' });
      return;
    }

    let data: any = null;
    try {
      data = generation.scheduleData ? JSON.parse(generation.scheduleData) : null;
    } catch {
      data = generation.scheduleData;
    }

    const items = await prisma.subjectSchedule.findMany({
      where: {
        department,
        academicYear: academicYear ?? undefined,
        semester: semester ?? undefined,
        yearLevel: yearLevel ?? undefined,
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
    });

    res.json({ success: true, data: { generation, scheduleData: data, scheduleItems: items } });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
};

export const getAllSubjectSchedule = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { academicYear } = req.query as Record<string, string | undefined>;
    console.log('📅 Fetching schedules for:', academicYear);
    
    const items = await prisma.subjectSchedule.findMany({
      where: academicYear ? { academicYear } : {},
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }]
    });
    
    console.log(`✅ Found ${items.length} schedules`);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};

// Get prospectus schedules - all subjects from 1st to 4th year including summer
export const getProspectusSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const { academicYear, program } = req.query as Record<string, string | undefined>;
    
    if (!academicYear || !program) {
      res.status(400).json({ 
        success: false, 
        message: 'Academic year and program are required' 
      });
      return;
    }
    
    console.log('📚 Fetching prospectus schedules for:', { academicYear, program });
    
    // Fetch all curriculum courses for the given academic year and program
    const curriculumCourses = await prisma.curriculumCourse.findMany({
      where: {
        curriculumYear: academicYear,
        programCode: program
      },
      orderBy: [
        { yearLevel: 'asc' },
        { period: 'asc' },
        { subjectCode: 'asc' }
      ]
    });
    
    // Fetch all subjects to get prerequisite information
    const subjects = await prisma.subject.findMany({
      select: {
        subjectCode: true,
        subjectDescription: true,
        lec: true,
        lab: true,
        units: true,
        prerequisite: true
      }
    });
    
    // Create a map of subject codes to subject details
    const subjectDetailsMap = new Map<string, any>();
    subjects.forEach(subject => {
      let prereqString = 'None';
      if (subject.prerequisite) {
        try {
          const prereqArray = typeof subject.prerequisite === 'string' 
            ? JSON.parse(subject.prerequisite) 
            : subject.prerequisite;
          prereqString = Array.isArray(prereqArray) && prereqArray.length > 0 ? prereqArray.join(', ') : 'None';
        } catch (error) {
          prereqString = 'None';
        }
      }
      
      subjectDetailsMap.set(subject.subjectCode, {
        subjectDescription: subject.subjectDescription,
        lec: subject.lec,
        lab: subject.lab,
        units: subject.units,
        prerequisite: prereqString
      });
    });
    
    // Group schedules by year level and semester
    const groupedData: Record<string, Record<string, any[]>> = {
      '1st Year': { '1st Semester': [], '2nd Semester': [], 'Summer': [] },
      '2nd Year': { '1st Semester': [], '2nd Semester': [], 'Summer': [] },
      '3rd Year': { '1st Semester': [], '2nd Semester': [], 'Summer': [] },
      '4th Year': { '1st Semester': [], '2nd Semester': [], 'Summer': [] }
    };
    
    // Use a Map to track unique subjects by code within each year/semester
    const subjectMap: Record<string, Record<string, Map<string, any>>> = {
      '1st Year': { '1st Semester': new Map(), '2nd Semester': new Map(), 'Summer': new Map() },
      '2nd Year': { '1st Semester': new Map(), '2nd Semester': new Map(), 'Summer': new Map() },
      '3rd Year': { '1st Semester': new Map(), '2nd Semester': new Map(), 'Summer': new Map() },
      '4th Year': { '1st Semester': new Map(), '2nd Semester': new Map(), 'Summer': new Map() }
    };

    // Populate the map with subjects from curriculum
    curriculumCourses.forEach(course => {
      const yearLevel = course.yearLevel || 'Unknown';
      const semester = course.period || 'Unknown';
      
      if (subjectMap[yearLevel] && subjectMap[yearLevel][semester]) {
        const subjectCode = course.subjectCode || '';
        
        // Only add if not already in the map
        if (subjectCode && !subjectMap[yearLevel][semester].has(subjectCode)) {
          const subjectDetails = subjectDetailsMap.get(subjectCode);
          
          subjectMap[yearLevel][semester].set(subjectCode, {
            code: subjectCode,
            title: subjectDetails?.subjectDescription || course.subjectDescription || '',
            prereq: subjectDetails?.prerequisite || 'None',
            lec: subjectDetails?.lec ?? course.lec ?? 0,
            lab: subjectDetails?.lab ?? course.lab ?? 0,
            total: subjectDetails?.units ?? course.units ?? 0
          });
        }
      }
    });

    // Convert Maps to arrays
    Object.keys(subjectMap).forEach(yearLevel => {
      Object.keys(subjectMap[yearLevel]).forEach(semester => {
        groupedData[yearLevel][semester] = Array.from(subjectMap[yearLevel][semester].values());
      });
    });
    
    console.log(`✅ Found ${curriculumCourses.length} curriculum courses for prospectus`);
    res.json({ success: true, data: groupedData });
  } catch (error) {
    console.error('Error fetching prospectus schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prospectus schedules' });
  }
};

// ===============================
// 📝 CREATE SCHEDULE ITEM
// ===============================
export const createScheduleItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subjectCode,
      subjectName,
      units,
      lec,
      lab,
      startTime,
      endTime,
      facultyId,
      facultyName,
      roomName,
      day,
      semester,
      academicYear,
      program,
      yearLevel,
      type,
      totalStudents
    } = req.body;

    // Validate required fields
    if (!subjectCode || !subjectName || !day || !startTime || !endTime || !roomName || !semester || !academicYear || !program || !yearLevel) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Create the schedule item
    const newSchedule = await prisma.subjectSchedule.create({
      data: {
        subjectId: subjectCode,
        subject: subjectCode,
        subjectCode,
        subjectName,
        units: units || 0,
        lec: lec || 0,
        lab: lab || 0,
        startTime,
        endTime,
        time: `${startTime}-${endTime}`,
        faculty: facultyId || facultyName || 'TBA',
        facultyId: facultyId || 'TBA',
        facultyName: facultyName || 'TBA',
        room: roomName,
        roomId: roomName,
        roomName,
        day,
        semester,
        academicYear,
        program,
        yearLevel,
        type: type || 'Lecture',
        status: 'active',
        students: totalStudents ? String(totalStudents) : '0',
        totalStudents: totalStudents || 0
      }
    });

    console.log(`✅ Created schedule item: ${subjectCode} - ${day} ${startTime}-${endTime}`);
    res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    console.error('Error creating schedule item:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule item' });
  }
};

// ===============================
// ✏️ UPDATE SCHEDULE ITEM
// ===============================
export const updateScheduleItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      subjectCode,
      subjectName,
      units,
      lec,
      lab,
      startTime,
      endTime,
      facultyId,
      facultyName,
      roomName,
      day,
      semester,
      academicYear,
      program,
      yearLevel,
      type,
      totalStudents
    } = req.body;

    // Check if schedule exists
    const existingSchedule = await prisma.subjectSchedule.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSchedule) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }

    // Update the schedule item
    const updatedSchedule = await prisma.subjectSchedule.update({
      where: { id: parseInt(id) },
      data: {
        subjectId: subjectCode,
        subject: subjectCode,
        subjectCode,
        subjectName,
        units,
        lec,
        lab,
        startTime,
        endTime,
        time: `${startTime}-${endTime}`,
        faculty: facultyId || facultyName || 'TBA',
        facultyId: facultyId || 'TBA',
        facultyName: facultyName || 'TBA',
        room: roomName,
        roomId: roomName,
        roomName,
        day,
        semester,
        academicYear,
        program,
        yearLevel,
        type: type || 'Lecture',
        students: totalStudents ? String(totalStudents) : '0',
        totalStudents: totalStudents || 0
      }
    });

    console.log(`✅ Updated schedule item: ${id}`);
    res.json({ success: true, data: updatedSchedule });
  } catch (error) {
    console.error('Error updating schedule item:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule item' });
  }
};

// ===============================
// 🗑️ DELETE SCHEDULE ITEM
// ===============================
export const deleteScheduleItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const existingSchedule = await prisma.subjectSchedule.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSchedule) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }

    // Delete the schedule item
    await prisma.subjectSchedule.delete({
      where: { id: parseInt(id) }
    });

    console.log(`✅ Deleted schedule item: ${id}`);
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule item' });
  }
};