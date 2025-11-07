import { db } from "../utils/db.server";

export interface FacultyRecommendation {
  id: number;
  firstname: string;
  lastname: string;
  middleInitial?: string;
  email: string;
  department: string;
  specialization?: string;
  matchScore: number;
  matchingTags: string[];
}

export const getFacultyRecommendationsForSubject = async (
  subjectTags: string[] | null,
  department?: string
): Promise<FacultyRecommendation[]> => {
  if (!subjectTags || subjectTags.length === 0) {
    return [];
  }

  // Get all faculty members
  const faculty = await db.user.findMany({
    where: {
      role: 'FACULTY',
      status: {
        in: ['VERIFIED', 'APPROVED'],
      },
      ...(department && { department }),
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      middleInitial: true,
      email: true,
      department: true,
      specialization: true,
    },
  });

  // Calculate match scores based on specialization and subject tags
  const recommendations: FacultyRecommendation[] = faculty
    .map((facultyMember) => {
      const facultySpecializations = facultyMember.specialization
        ? (typeof facultyMember.specialization === 'string' 
            ? facultyMember.specialization.split(',').map((s: string) => s.trim().toLowerCase())
            : [])
        : [];

      const subjectTagsLower = subjectTags.map(tag => tag.toLowerCase());
      
      // Find matching tags between faculty specialization and subject tags
      const matchingTags = facultySpecializations.filter((spec: string) =>
        subjectTagsLower.some(tag => 
          tag.includes(spec) || spec.includes(tag)
        )
      );

      // Calculate match score (percentage of matching tags)
      const matchScore = matchingTags.length > 0 
        ? (matchingTags.length / Math.max(facultySpecializations.length, subjectTagsLower.length)) * 100
        : 0;

      return {
        id: facultyMember.id,
        firstname: facultyMember.firstname,
        lastname: facultyMember.lastname,
        middleInitial: facultyMember.middleInitial,
        email: facultyMember.email,
        department: facultyMember.department,
        specialization: typeof facultyMember.specialization === 'string' 
          ? facultyMember.specialization 
          : undefined,
        matchScore: Math.round(matchScore),
        matchingTags,
      };
    })
    .filter(rec => rec.matchScore > 0) // Only include faculty with some match
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending

  return recommendations;
};

export const getFacultyRecommendationsForMultipleSubjects = async (
  subjects: Array<{ id: number; tags: string[] | null; code: string; name: string }>,
  department?: string
): Promise<Record<number, FacultyRecommendation[]>> => {
  const recommendations: Record<number, FacultyRecommendation[]> = {};

  for (const subject of subjects) {
    recommendations[subject.id] = await getFacultyRecommendationsForSubject(
      subject.tags,
      department
    );
  }

  return recommendations;
};