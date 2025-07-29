const { db } = require("../server/src/db");
const { projects, projectMembers } = require("../server/src/db/schema");
const { eq } = require("drizzle-orm");

async function populateMemberIds() {
  try {
    console.log("Starting to populate memberIds for existing projects...");

    // Get all projects
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        memberIds: projects.memberIds,
      })
      .from(projects);

    console.log(`Found ${allProjects.length} projects`);

    for (const project of allProjects) {
      // Get all members for this project
      const members = await db
        .select({
          userId: projectMembers.userId,
        })
        .from(projectMembers)
        .where(eq(projectMembers.projectId, project.id));

      const memberIds = members.map((m) => m.userId);

      console.log(`Project "${project.name}" has ${memberIds.length} members`);

      // Update the project with the memberIds
      await db
        .update(projects)
        .set({
          memberIds: memberIds,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(projects.id, project.id));
    }

    console.log("Successfully populated memberIds for all projects!");
  } catch (error) {
    console.error("Error populating memberIds:", error);
  }
}

populateMemberIds();
