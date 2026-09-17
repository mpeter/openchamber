import { describe, expect, test } from 'bun:test';
import { buildSessionBootstrapDemands } from './sessionBootstrapDemands';

describe('SessionProjectCollection', () => {
  test('does not bootstrap a collapsed project until the user opens it', () => {
    const demands = buildSessionBootstrapDemands({
      projectSections: [{
        project: { id: 'project', normalizedPath: '/project' },
        groups: [{ id: 'worktree', directory: '/project/worktree', isMain: false }],
      }],
      activeProjectId: null,
      collapsedProjects: new Set(['project']),
      collapsedGroups: new Set(),
      currentDirectory: null,
      currentSessionDirectory: null,
    });

    expect(demands).toEqual([]);
  });

});
