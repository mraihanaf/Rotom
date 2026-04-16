import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompletionStats() {
    // Get all students (users with roles that are students or mentors)
    const students = await this.prisma.user.findMany({
      select: {
        id: true,
      },
    });

    const totalStudents = students.length;
    const studentIds = students.map((s) => s.id);

    // Get all subjects with their assignments
    const subjects = await this.prisma.subject.findMany({
      include: {
        assignments: {
          include: {
            assignmentStatuses: {
              where: {
                userId: { in: studentIds },
              },
              select: {
                userId: true,
                done: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Map to output format
    const mappedSubjects = subjects.map((subject) => {
      const assignments = subject.assignments.map((assignment) => {
        const completedCount = assignment.assignmentStatuses.filter(
          (s) => s.done,
        ).length;

        return {
          assignmentId: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          totalStudents,
          completedCount,
          completionPercentage:
            totalStudents > 0
              ? Math.round((completedCount / totalStudents) * 100)
              : 0,
        };
      });

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        assignments,
      };
    });

    // Calculate overall stats
    let totalAssignments = 0;
    let totalCompletions = 0;

    for (const subject of mappedSubjects) {
      for (const assignment of subject.assignments) {
        totalAssignments++;
        totalCompletions += assignment.completedCount;
      }
    }

    const maxPossibleCompletions = totalAssignments * totalStudents;
    const overallPercentage =
      maxPossibleCompletions > 0
        ? Math.round((totalCompletions / maxPossibleCompletions) * 100)
        : 0;

    return {
      subjects: mappedSubjects,
      overallStats: {
        totalStudents,
        totalAssignments,
        totalCompletions,
        overallPercentage,
      },
    };
  }

  async getAssignmentCompletions(assignmentId: string) {
    // Get all students (including mentors)
    const students = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get assignment with its completion statuses
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        assignmentStatuses: {
          select: {
            userId: true,
            done: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Create a map of userId -> done status
    const completionMap = new Map(
      assignment.assignmentStatuses.map((s) => [s.userId, s.done]),
    );

    // Map students with their completion status
    const studentsWithStatus = students.map((student) => ({
      userId: student.id,
      name: student.name,
      image: student.image,
      done: completionMap.get(student.id) ?? false,
    }));

    const completedCount = studentsWithStatus.filter((s) => s.done).length;
    const totalStudents = students.length;

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      description: assignment.description,
      totalStudents,
      completedCount,
      completionPercentage:
        totalStudents > 0
          ? Math.round((completedCount / totalStudents) * 100)
          : 0,
      students: studentsWithStatus,
    };
  }
}
