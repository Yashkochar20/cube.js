import { AvailableCube, AvailableMembers } from '@cubejs-client/react';
import { MemberType, TCubeMember } from '@cubejs-client/core';
import { fetch } from 'whatwg-fetch';

export function ucfirst(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

export function getNameMemberPairs(members: AvailableCube[]) {
  const items: [string, TCubeMember & MemberType][] = [];

  members.forEach((cube) =>
    cube.members.forEach((member) => {
      items.push([member.name, member]);
    })
  );

  return items;
}

export type MembersByCube = {
  cubeName: string;
  cubeTitle: string;
  measures: TCubeMember[];
  dimensions: TCubeMember[];
  segments: TCubeMember[];
  timeDimensions: TCubeMember[];
};

export function getMembersByCube(
  availableMembers: AvailableMembers
): MembersByCube[] {
  const membersByCube: Record<string, MembersByCube> = {};

  Object.entries(availableMembers).forEach(([memberType, cubes]) => {
    cubes.forEach((cube) => {
      if (!membersByCube[cube.cubeName]) {
        membersByCube[cube.cubeName] = {
          cubeName: cube.cubeName,
          cubeTitle: cube.cubeTitle,
          measures: [],
          dimensions: [],
          segments: [],
          timeDimensions: [],
        };
      }

      cube.members.forEach((member) => {
        membersByCube[cube.cubeName] = {
          ...membersByCube[cube.cubeName],
          [memberType]: [...membersByCube[cube.cubeName][memberType], member],
        };
      });
    });
  });

  return Object.values(membersByCube);
}

export function playgroundFetch(url, options: any = {}) {
  const { retries = 0, ...restOptions } = options;

  return fetch(url, restOptions)
    .then(async (r) => {
      if (r.status === 500) {
        let errorText = await r.text();
        try {
          const json = JSON.parse(errorText);
          errorText = json.error;
        } catch (e) {
          // Nothing
        }
        throw errorText;
      }
      return r;
    })
    .catch((e) => {
      if (e.message === 'Network request failed' && retries > 0) {
        return playgroundFetch(url, { options, retries: retries - 1 });
      }
      throw e;
    });
}

type RequestOptions = {
  token?: string;
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

export async function request(
  endpoint: string,
  method: string = 'GET',
  options: RequestOptions
) {
  const { body, token } = options;

  const headers: Record<string, string> = {};

  if (token) {
    headers.authorization = token;
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : null),
  });

  return {
    ok: response.ok,
    json: await response.json()
  };
}
