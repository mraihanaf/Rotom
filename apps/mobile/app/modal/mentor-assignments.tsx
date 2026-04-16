import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { Stack, router } from 'expo-router';
import { ArrowLeft, ChevronRight, BookOpen, CheckCircle, XCircle, BarChart3, Users } from 'lucide-react-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { View, Pressable } from '@/tw';
import { useQuery } from '@tanstack/react-query';
import { useUserRole } from '@/lib/hooks/useUserRole';

type ViewState =
  | { type: 'subjects' }
  | { type: 'assignments'; subjectId: string; subjectName: string }
  | { type: 'students'; assignmentId: string; title: string };

export default function MentorAssignmentsScreen() {
  const { isMentor, isAdmin } = useUserRole();
  const [viewState, setViewState] = React.useState<ViewState>({ type: 'subjects' });
  const [refreshing, setRefreshing] = React.useState(false);

  // Redirect if not mentor or admin
  React.useEffect(() => {
    if (!isMentor && !isAdmin) {
      Alert.alert('Access Denied', 'Only mentors can view this screen.');
      router.back();
    }
  }, [isMentor, isAdmin]);

  // Main stats query - always runs
  const { data: statsData, isPending, isError, refetch } = useQuery(
    orpc.assignments.getCompletionStats.queryOptions()
  );

  // Student completions query - only enabled when in students view
  const { data: completionData, isPending: isLoadingCompletion } = useQuery({
    ...orpc.assignments.getAssignmentCompletions.queryOptions({
      input: { id: viewState.type === 'students' ? viewState.assignmentId : '' }
    }),
    enabled: viewState.type === 'students'
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBack = () => {
    if (viewState.type === 'assignments') {
      setViewState({ type: 'subjects' });
    } else if (viewState.type === 'students') {
      const subject = statsData?.subjects.find(s =>
        s.assignments.some(a => a.assignmentId === viewState.assignmentId)
      );
      if (subject) {
        setViewState({
          type: 'assignments',
          subjectId: subject.subjectId,
          subjectName: subject.subjectName
        });
      } else {
        setViewState({ type: 'subjects' });
      }
    } else {
      router.back();
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Subjects View Content
  const SubjectsContent = () => {
    if (!statsData?.subjects.length) {
      return (
        <View className="items-center py-12 px-4">
          <BookOpen size={48} color="#d1d5db" />
          <Text className="text-slate-400 text-sm mt-4 text-center">
            No subjects or assignments found.
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4">
        <View className="bg-white rounded-2xl p-5 border border-gray-100">
          <View className="flex-row items-center gap-2 mb-3">
            <BarChart3 size={20} color="#0fae43" />
            <Text className="text-emerald-700 text-sm font-semibold uppercase tracking-wider">
              Overall Progress
            </Text>
          </View>
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-3xl font-bold">
                {statsData.overallStats.overallPercentage}%
              </Text>
              <Text className="text-slate-500 text-xs mt-1">
                {statsData.overallStats.totalCompletions} of {statsData.overallStats.totalStudents * statsData.overallStats.totalAssignments} completed
              </Text>
            </View>
            <View className="bg-emerald-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-emerald-700">
                {statsData.overallStats.totalStudents} Students
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-lg font-bold px-1 mt-2">Select Subject</Text>

        {statsData.subjects.map((subject) => {
          const totalAssignments = subject.assignments.length;
          const avgCompletion = subject.assignments.reduce((sum, a) => sum + a.completionPercentage, 0) / (totalAssignments || 1);

          return (
            <Pressable
              key={subject.subjectId}
              onPress={() => setViewState({
                type: 'assignments',
                subjectId: subject.subjectId,
                subjectName: subject.subjectName
              })}
              className="bg-white rounded-xl p-4 border border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-bold">{subject.subjectName}</Text>
                  <Text className="text-slate-500 text-xs mt-1">
                    {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                    <Text className="text-xs font-semibold text-gray-600">
                      {Math.round(avgCompletion)}% avg
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // Assignments View Content
  const AssignmentsContent = () => {
    if (viewState.type !== 'assignments') return null;

    const subject = statsData?.subjects.find(s => s.subjectId === viewState.subjectId);
    if (!subject) return null;

    return (
      <View className="gap-4">
        <View className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <Text className="text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-1">
            Subject
          </Text>
          <Text className="text-emerald-900 text-lg font-bold">
            {subject.subjectName}
          </Text>
        </View>

        <Text className="text-lg font-bold px-1 mt-2">Select Assignment</Text>

        {subject.assignments.map((assignment) => (
          <Pressable
            key={assignment.assignmentId}
            onPress={() => setViewState({
              type: 'students',
              assignmentId: assignment.assignmentId,
              title: assignment.title
            })}
            className="bg-white rounded-xl p-4 border border-gray-100 active:bg-gray-50"
          >
            <View className="gap-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-bold" numberOfLines={2}>
                    {assignment.title}
                  </Text>
                  <Text className="text-slate-500 text-xs mt-1">
                    Due {formatDate(assignment.dueDate)}
                  </Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </View>

              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">
                    {assignment.completedCount} of {assignment.totalStudents} completed
                  </Text>
                  <Text className={`text-xs font-bold ${
                    assignment.completionPercentage >= 80 ? 'text-emerald-600' :
                    assignment.completionPercentage >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {assignment.completionPercentage}%
                  </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${
                      assignment.completionPercentage >= 80 ? 'bg-emerald-500' :
                      assignment.completionPercentage >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${assignment.completionPercentage}%` }}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        ))}

        {subject.assignments.length === 0 && (
          <View className="items-center py-12">
            <BookOpen size={48} color="#d1d5db" />
            <Text className="text-slate-400 text-sm mt-4">
              No assignments for this subject.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Students View Content
  const StudentsContent = () => {
    if (viewState.type !== 'students') return null;

    if (isLoadingCompletion) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color="#0fae43" />
          <Text className="text-slate-400 text-sm mt-4">Loading students...</Text>
        </View>
      );
    }

    // Debug logging
    console.log('[MentorAssignments] completionData:', completionData);

    if (!completionData || !completionData.students || completionData.students.length === 0) {
      return (
        <View className="items-center py-12 px-4">
          <Users size={48} color="#d1d5db" />
          <Text className="text-slate-400 text-sm mt-4 text-center">
            No students found for this assignment.
          </Text>
        </View>
      );
    }

    const doneStudents = completionData.students.filter(s => s.done);
    const notDoneStudents = completionData.students.filter(s => !s.done);
    const totalStudents = completionData.students.length;
    const completionPercentage = totalStudents > 0 ? Math.round((doneStudents.length / totalStudents) * 100) : 0;

    return (
      <View className="gap-4">
        <View className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <Text className="text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-1">
            Assignment
          </Text>
          <Text className="text-emerald-900 text-base font-bold">
            {viewState.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-2">
            <View className="bg-emerald-200 px-2 py-0.5 rounded">
              <Text className="text-xs font-semibold text-emerald-800">
                {doneStudents.length} Done
              </Text>
            </View>
            <View className="bg-red-200 px-2 py-0.5 rounded">
              <Text className="text-xs font-semibold text-red-800">
                {notDoneStudents.length} Not Done
              </Text>
            </View>
          </View>
          <View className="mt-3">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs text-slate-600">Completion Rate</Text>
              <Text className={`text-xs font-bold ${
                completionPercentage >= 80 ? 'text-emerald-600' :
                completionPercentage >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {completionPercentage}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  completionPercentage >= 80 ? 'bg-emerald-500' :
                  completionPercentage >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </View>
          </View>
        </View>

        {doneStudents.length > 0 && (
          <View className="gap-3">
            <Text className="text-sm font-bold text-emerald-700 uppercase tracking-wider px-1">
              Completed ({doneStudents.length})
            </Text>
            {doneStudents.map((student) => (
              <View
                key={student.userId}
                className="bg-white rounded-xl p-3 border border-emerald-100 flex-row items-center gap-3"
              >
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <CheckCircle size={20} color="#10b981" />
                </View>
                <Text className="flex-1 font-medium">{student.name}</Text>
              </View>
            ))}
          </View>
        )}

        {notDoneStudents.length > 0 && (
          <View className="gap-3">
            <Text className="text-sm font-bold text-red-700 uppercase tracking-wider px-1">
              Not Completed ({notDoneStudents.length})
            </Text>
            {notDoneStudents.map((student) => (
              <View
                key={student.userId}
                className="bg-white rounded-xl p-3 border border-red-100 flex-row items-center gap-3"
              >
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                  <XCircle size={20} color="#ef4444" />
                </View>
                <Text className="flex-1 font-medium">{student.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getTitle = () => {
    if (viewState.type === 'subjects') return 'Mentor View';
    if (viewState.type === 'assignments') return viewState.subjectName;
    return 'Students';
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f6]" edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />

      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <Pressable
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">
          {getTitle()}
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isPending ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#0fae43" />
            <Text className="text-slate-400 text-sm mt-4">Loading...</Text>
          </View>
        ) : isError ? (
          <View className="items-center py-12 px-4">
            <Text className="text-red-500 text-center">
              Failed to load data. Pull down to retry.
            </Text>
          </View>
        ) : (
          <>
            {viewState.type === 'subjects' && <SubjectsContent />}
            {viewState.type === 'assignments' && <AssignmentsContent />}
            {viewState.type === 'students' && <StudentsContent />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
