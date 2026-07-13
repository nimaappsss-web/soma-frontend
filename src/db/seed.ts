import { db } from "./db";

export const seedTestData = async () => {
  const existingStudents = await db.students.count();
  if (existingStudents > 0) return; // don't seed twice

  await db.students.bulkAdd([
    {
      id: "1",
      name: "Adeola Bakare",
      classId: "JSS 1A",
      status: "ACTIVE",
      schoolId: "school_1",
      createdAt: Date.now(),
    },
    {
      id: "2",
      name: "Chidi Okonkwo",
      classId: "JSS 1A",
      status: "ACTIVE",
      schoolId: "school_1",
      createdAt: Date.now(),
    },
    {
      id: "3",
      name: "Fatima Musa",
      classId: "JSS 1A",
      status: "ACTIVE",
      schoolId: "school_1",
      createdAt: Date.now(),
    },
    {
      id: "4",
      name: "Ibrahim Sule",
      classId: "JSS 1A",
      status: "ACTIVE",
      schoolId: "school_1",
      createdAt: Date.now(),
    },
    {
      id: "5",
      name: "Ngozi Eze",
      classId: "JSS 1A",
      status: "ACTIVE",
      schoolId: "school_1",
      createdAt: Date.now(),
    },
  ]);

  console.log("Seeded test data");
};
