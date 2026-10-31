import { describe, it, expect } from '@jest/globals';
import { findNextRequestIndex } from './next-request';

const COLLECTION_PATH = '/collections/demo';

// Two folders each holding a request named "Get Fact", like the setup reported in #3407.
const requests = [
  { name: 'Login', pathname: `${COLLECTION_PATH}/Login.bru` },
  { name: 'Get Fact', pathname: `${COLLECTION_PATH}/folder1/Get Fact.bru` },
  { name: 'Get Fact', pathname: `${COLLECTION_PATH}/folder2/Get Fact.bru` },
  { name: 'Renamed Request', pathname: `${COLLECTION_PATH}/folder2/nested/original-file.yml` }
];

describe('findNextRequestIndex', () => {
  describe('by request name', () => {
    it('returns the first request with that name, as before', () => {
      expect(findNextRequestIndex(requests, 'Get Fact', COLLECTION_PATH)).toBe(1);
      expect(findNextRequestIndex(requests, 'Login', COLLECTION_PATH)).toBe(0);
    });

    it('does not treat a plain name as a file name', () => {
      expect(findNextRequestIndex(requests, 'original-file', COLLECTION_PATH)).toBe(-1);
    });

    it('returns -1 when no request has that name', () => {
      expect(findNextRequestIndex(requests, 'Missing', COLLECTION_PATH)).toBe(-1);
    });
  });

  describe('by path relative to the collection root', () => {
    it('targets the request in the given folder when names collide', () => {
      expect(findNextRequestIndex(requests, 'folder2/Get Fact', COLLECTION_PATH)).toBe(2);
      expect(findNextRequestIndex(requests, 'folder1/Get Fact', COLLECTION_PATH)).toBe(1);
    });

    it('accepts the path with or without the request file extension', () => {
      expect(findNextRequestIndex(requests, 'folder2/Get Fact.bru', COLLECTION_PATH)).toBe(2);
      expect(findNextRequestIndex(requests, 'folder2/nested/original-file.yml', COLLECTION_PATH)).toBe(3);
      expect(findNextRequestIndex(requests, 'folder2/nested/original-file', COLLECTION_PATH)).toBe(3);
    });

    it('keeps resolving a .bru path after the collection moved to the yml format', () => {
      expect(findNextRequestIndex(requests, 'folder2/nested/original-file.bru', COLLECTION_PATH)).toBe(3);
    });

    it('targets a root-level request through its file extension or a leading ./', () => {
      expect(findNextRequestIndex(requests, 'Login.bru', COLLECTION_PATH)).toBe(0);
      expect(findNextRequestIndex(requests, './Login', COLLECTION_PATH)).toBe(0);
    });

    it('normalizes Windows separators, leading slashes and duplicate separators', () => {
      expect(findNextRequestIndex(requests, 'folder2\\Get Fact', COLLECTION_PATH)).toBe(2);
      expect(findNextRequestIndex(requests, '/folder2//Get Fact', COLLECTION_PATH)).toBe(2);
    });

    it('matches requests whose pathname uses Windows separators', () => {
      const windowsRequests = [
        { name: 'Get Fact', pathname: 'C:\\collections\\demo\\folder1\\Get Fact.bru' },
        { name: 'Get Fact', pathname: 'C:\\collections\\demo\\folder2\\Get Fact.bru' }
      ];

      expect(findNextRequestIndex(windowsRequests, 'folder2/Get Fact', 'C:\\collections\\demo')).toBe(1);
    });

    it('falls back to the name lookup when no request lives at that path', () => {
      const requestsWithSlashInName = [
        ...requests,
        { name: 'v1/health', pathname: `${COLLECTION_PATH}/health.bru` }
      ];

      expect(findNextRequestIndex(requestsWithSlashInName, 'v1/health', COLLECTION_PATH)).toBe(4);
    });

    it('returns -1 when the path is outside the requests of the current run', () => {
      expect(findNextRequestIndex(requests, 'folder3/Get Fact', COLLECTION_PATH)).toBe(-1);
    });

    it('ignores requests that live outside the collection root', () => {
      const outside = [{ name: 'Get Fact', pathname: '/other/folder2/Get Fact.bru' }];

      expect(findNextRequestIndex(outside, 'folder2/Get Fact', COLLECTION_PATH)).toBe(-1);
    });
  });
});
