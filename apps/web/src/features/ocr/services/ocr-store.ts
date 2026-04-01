"use client";

import { create } from "zustand";

import type {
  OcrJobEntity,
  OcrResultEntity,
} from "@/features/ocr/domain/ocr-job";

interface OcrStoreState {
  jobsByDocument: Record<string, OcrJobEntity[]>;
  resultsByJob: Record<string, OcrResultEntity[]>;
  selectedJobIdByDocument: Record<string, string | null>;
  setDocumentJobs: (documentKey: string, jobs: OcrJobEntity[]) => void;
  upsertJob: (documentKey: string, job: OcrJobEntity) => void;
  setJobResults: (jobId: string, results: OcrResultEntity[]) => void;
  selectJob: (documentKey: string, jobId: string | null) => void;
  getSelectedJob: (documentKey: string) => OcrJobEntity | undefined;
  getResultsForSelectedJob: (documentKey: string) => OcrResultEntity[];
}

export const useOcrStore = create<OcrStoreState>((set, get) => ({
  jobsByDocument: {},
  resultsByJob: {},
  selectedJobIdByDocument: {},

  setDocumentJobs: (documentKey, jobs) => {
    set((state) => {
      const selectedId = state.selectedJobIdByDocument[documentKey] ?? null;
      const hasSelected = selectedId
        ? jobs.some((job) => job.id === selectedId)
        : false;
      return {
        jobsByDocument: {
          ...state.jobsByDocument,
          [documentKey]: jobs,
        },
        selectedJobIdByDocument: {
          ...state.selectedJobIdByDocument,
          [documentKey]: hasSelected ? selectedId : jobs[0]?.id ?? null,
        },
      };
    });
  },

  upsertJob: (documentKey, job) => {
    set((state) => {
      const existing = state.jobsByDocument[documentKey] ?? [];
      const index = existing.findIndex((item) => item.id === job.id);
      const next =
        index === -1
          ? [job, ...existing]
          : existing.map((item) => (item.id === job.id ? job : item));
      return {
        jobsByDocument: {
          ...state.jobsByDocument,
          [documentKey]: next,
        },
        selectedJobIdByDocument: {
          ...state.selectedJobIdByDocument,
          [documentKey]: state.selectedJobIdByDocument[documentKey] ?? job.id,
        },
      };
    });
  },

  setJobResults: (jobId, results) => {
    set((state) => ({
      resultsByJob: {
        ...state.resultsByJob,
        [jobId]: results,
      },
    }));
  },

  selectJob: (documentKey, jobId) => {
    set((state) => ({
      selectedJobIdByDocument: {
        ...state.selectedJobIdByDocument,
        [documentKey]: jobId,
      },
    }));
  },

  getSelectedJob: (documentKey) => {
    const state = get();
    const selectedId = state.selectedJobIdByDocument[documentKey] ?? null;
    if (!selectedId) {
      return undefined;
    }
    return (state.jobsByDocument[documentKey] ?? []).find(
      (job) => job.id === selectedId,
    );
  },

  getResultsForSelectedJob: (documentKey) => {
    const state = get();
    const selectedId = state.selectedJobIdByDocument[documentKey] ?? null;
    if (!selectedId) {
      return [];
    }
    return state.resultsByJob[selectedId] ?? [];
  },
}));
