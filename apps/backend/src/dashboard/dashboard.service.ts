import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const today = new Date();
    const todayDow = today.getDay();

    // Fetch user profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        birthday: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Fetch fund (single record with id=1)
    const fund = await this.prisma.fund.findUnique({
      where: { id: 1 },
      select: {
        totalAmount: true,
        currency: true,
      },
    });

    // Fetch today's schedule
    const todaySchedule = await this.prisma.subjectSchedule.findMany({
      where: { dayOfWeek: todayDow },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ startTime: 'asc' }],
    });

    // Fetch all assignments with user's completion status
    const assignments = await this.prisma.assignment.findMany({
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        assignmentStatuses: {
          where: { userId },
          select: { done: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Map assignments with done status
    const mappedAssignments = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      subject: a.subject,
      done: a.assignmentStatuses[0]?.done ?? false,
    }));

    const pendingAssignments = mappedAssignments.filter((a) => !a.done).slice(0, 5);

    // Calculate stats
    const total = mappedAssignments.length;
    const completed = mappedAssignments.filter((a) => a.done).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        role: user.role,
        birthday: user.birthday,
      },
      fund: {
        totalAmount: fund?.totalAmount ?? 0,
        currency: fund?.currency ?? 'idr',
      },
      todaySchedule: todaySchedule.map((s) => ({
        id: s.id,
        subjectId: s.subjectId,
        subjectName: s.subject.name,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
      })),
      pendingAssignments,
      assignmentStats: {
        total,
        completed,
        pending,
        percentage,
      },
    };
  }
}
