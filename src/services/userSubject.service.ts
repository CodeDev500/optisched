import { db } from "../utils/db.server";

export interface UserSubjectAssignment {
  userId: number;
  subjectId: number;
}

export const createUserSubjectAssignment = async (data: UserSubjectAssignment) => {
  // Check if assignment already exists
  const existingAssignment = await db.userSubject.findFirst({
    where: {
      userId: data.userId,
      subjectId: data.subjectId
    }
  });

  if (existingAssignment) {
    throw new Error("Subject is already assigned to this user");
  }

  return db.userSubject.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          department: true,
          designation: true
        }
      },
      subject: {
        select: {
          id: true,
          subjectCode: true,
          subjectDescription: true,
          lec: true,
          lab: true,
          units: true
        }
      }
    }
  });
};

export const getUserSubjects = async (userId: number) => {
  return db.userSubject.findMany({
    where: { userId },
    include: {
      subject: {
        select: {
          id: true,
          subjectCode: true,
          subjectDescription: true,
          lec: true,
          lab: true,
          units: true
        }
      }
    }
  });
};

export const getSubjectUsers = async (subjectId: number) => {
  return db.userSubject.findMany({
    where: { subjectId },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          department: true,
          designation: true,
          role: true
        }
      }
    }
  });
};

export const removeUserSubjectAssignment = async (userId: number, subjectId: number) => {
  const assignment = await db.userSubject.findFirst({
    where: {
      userId,
      subjectId
    }
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  return db.userSubject.delete({
    where: {
      id: assignment.id
    }
  });
};

export const getAllUserSubjectAssignments = async () => {
  return db.userSubject.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          department: true,
          designation: true,
          role: true
        }
      },
      subject: {
        select: {
          id: true,
          subjectCode: true,
          subjectDescription: true,
          lec: true,
          lab: true,
          units: true
        }
      }
    }
  });
};

export const getFacultyWithAssignedSubjects = async () => {
  return db.user.findMany({
    where: {
      role: 'FACULTY'
    },
    include: {
      userSubjects: {
        include: {
          subject: {
            select: {
              id: true,
              subjectCode: true,
              subjectDescription: true,
              lec: true,
              lab: true,
              units: true
            }
          }
        }
      },
      units_loads: true
    }
  });
};

export const getUnassignedSubjects = async () => {
  return db.subject.findMany({
    where: {
      userSubjects: {
        none: {}
      }
    }
  });
};

export const getFacultySubjectLoad = async (userId: number) => {
  const userSubjects = await db.userSubject.findMany({
    where: { userId },
    include: {
      subject: {
        select: {
          units: true
        }
      }
    }
  });

  const totalUnits = userSubjects.reduce((sum, assignment) => {
    return sum + assignment.subject.units;
  }, 0);

  return {
    totalSubjects: userSubjects.length,
    totalUnits,
    subjects: userSubjects
  };
};