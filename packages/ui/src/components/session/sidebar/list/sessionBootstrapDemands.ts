import type { DirectoryBootstrapDemand, DirectoryBootstrapPriority } from "@/sync/child-store"
import { normalizePath } from "../utils"

type BootstrapProjectSection = {
  project: { id: string; normalizedPath: string }
  groups: Array<{
    id: string
    directory: string | null
    isArchivedBucket?: boolean
    isMain: boolean
  }>
}

const PRIORITY_RANK = {
  selected: 0,
  "active-project": 1,
  expanded: 2,
  visible: 3,
  background: 4,
} satisfies Record<DirectoryBootstrapPriority, number>

export function buildSessionBootstrapDemands(input: {
  projectSections?: BootstrapProjectSection[]
  activeProjectDirectory?: string | null
  activeProjectId: string | null
  collapsedProjects: ReadonlySet<string>
  collapsedGroups: ReadonlySet<string>
  currentDirectory: string | null
  currentSessionDirectory: string | null
}): DirectoryBootstrapDemand[] {
  const byDirectory = new Map<string, DirectoryBootstrapDemand>()
  const add = (
    directory: string | null | undefined,
    priority: DirectoryBootstrapPriority,
    reason: DirectoryBootstrapDemand["reason"],
  ) => {
    const normalizedDirectory = normalizePath(directory ?? null)
    if (!normalizedDirectory) return
    const existing = byDirectory.get(normalizedDirectory)
    if (existing && PRIORITY_RANK[existing.priority] <= PRIORITY_RANK[priority]) return
    byDirectory.set(normalizedDirectory, { directory: normalizedDirectory, priority, reason })
  }

  add(input.activeProjectDirectory, "active-project", "project-expanded")

  for (const section of input.projectSections ?? []) {
    const projectExpanded = !input.collapsedProjects.has(section.project.id)
    const projectPriority = section.project.id === input.activeProjectId
      ? "active-project"
      : "expanded"
    if (!projectExpanded && section.project.id !== input.activeProjectId) continue
    add(
      section.project.normalizedPath,
      projectPriority,
      "project-expanded",
    )

    for (const group of section.groups) {
      if (!group.directory || group.isArchivedBucket || group.isMain) continue
      const groupExpanded = projectExpanded && !input.collapsedGroups.has(`${section.project.id}:${group.id}`)
      const groupPriority: DirectoryBootstrapPriority = groupExpanded ? "expanded" : "visible"
      add(
        group.directory,
        groupPriority,
        groupExpanded ? "worktree-expanded" : "known-worktree",
      )
    }
  }

  add(input.currentDirectory, "selected", "current-directory")
  add(input.currentSessionDirectory, "selected", "selected-session")
  return [...byDirectory.values()]
}
