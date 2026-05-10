/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { formatPollAsText, formatPollAsCsv, downloadBlob } from "./export-utils";
import { Poll } from "@/types";

const mockPoll: Poll = {
  id: "poll-1",
  creatorId: "user-1",
  title: "Test Poll & Results",
  description: "A description containing \"quotes\" and , commas.",
  totalVotes: 100,
  status: "active",
  visibility: "public",
  createdAt: "2024-01-01",
  expiresAt: "2024-12-31",
  options: [],
  questions: [
    {
      id: "q1",
      text: "Question One?",
      options: [
        { id: "opt1", text: "Option A", votes: 75 },
        { id: "opt2", text: "Option B", votes: 25 },
      ]
    },
    {
      id: "q2",
      text: "Is this \"cool\"?",
      options: [
        { id: "opt3", text: "Yes, indeed", votes: 0 },
      ]
    }
  ]
};

describe("export-utils", () => {
  describe("formatPollAsText", () => {
    it("includes the title and description", () => {
      const output = formatPollAsText(mockPoll);
      expect(output).toContain("Poll Results: Test Poll & Results");
      expect(output).toContain("A description containing");
    });

    it("displays calculated percentages correctly", () => {
      const output = formatPollAsText(mockPoll);
      expect(output).toContain("Option A: 75 votes (75%)");
      expect(output).toContain("Option B: 25 votes (25%)");
      expect(output).toContain("Yes, indeed: 0 votes (0%)");
    });

    it("correctly labels nested questions", () => {
      const output = formatPollAsText(mockPoll);
      expect(output).toContain("Q1: Question One?");
      expect(output).toContain("Q2: Is this \"cool\"?");
    });
  });

  describe("formatPollAsCsv", () => {
    it("generates valid CSV structure with header row", () => {
      const output = formatPollAsCsv(mockPoll);
      const lines = output.split("\n");
      expect(lines[0]).toBe('"Question","Option","Votes","Percentage"');
    });

    it("escapes quotes and commas accurately in CSV values", () => {
      const output = formatPollAsCsv(mockPoll);
      // Checks row "Is this "cool"?", "Yes, indeed", "0", "0%"
      expect(output).toContain('"Is this ""cool""?"');
      expect(output).toContain('"Yes, indeed"');
    });

    it("handles flat polls (no questions array, only options) gracefully", () => {
      const flatPoll: Poll = {
        ...mockPoll,
        questions: [],
        options: [
          { id: "o1", text: "Standalone Option", votes: 10 }
        ]
      };
      
      const output = formatPollAsCsv(flatPoll);
      expect(output).toContain('"Test Poll & Results"');
      expect(output).toContain('"Standalone Option"');
    });
  });

  describe("downloadBlob", () => {
    it("executes object URL flows using document element lifecycle", () => {
      const createObjectURL = vi.fn().mockReturnValue("blob:test-url");
      const revokeObjectURL = vi.fn();
      
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const mockClick = vi.fn();
      const mockAppend = vi.spyOn(document.body, "appendChild");
      const mockRemove = vi.spyOn(document.body, "removeChild");

      // Mock element
      const mockAnchor = document.createElement("a");
      mockAnchor.click = mockClick;
      
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "a") return mockAnchor;
        return document.createElement(tagName);
      });

      downloadBlob("test data", "test.csv", "text/csv");

      expect(createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.getAttribute("href")).toBe("blob:test-url");
      expect(mockAnchor.getAttribute("download")).toBe("test.csv");
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppend).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });
  });

  describe("downloadPollAsExcel", () => {
    it("lazily loads xlsx module and constructs sheets based on poll data", async () => {
      // Setup mocks for the internal dynamic import
      const mockAoaToSheet = vi.fn().mockReturnValue({});
      const mockBookNew = vi.fn().mockReturnValue({});
      const mockBookAppendSheet = vi.fn();
      const mockWriteFile = vi.fn();

      // Mock the dynamic import by defining what the 'xlsx' module returns when imported
      vi.doMock("xlsx", () => ({
        default: {
          utils: {
            aoa_to_sheet: mockAoaToSheet,
            book_new: mockBookNew,
            book_append_sheet: mockBookAppendSheet,
          },
          writeFile: mockWriteFile,
        },
        utils: {
          aoa_to_sheet: mockAoaToSheet,
          book_new: mockBookNew,
          book_append_sheet: mockBookAppendSheet,
        },
        writeFile: mockWriteFile,
      }));

      // Re-import under vitest doMock context requires async dynamic import usually, 
      // but here we are simply calling our exported function which itself calls dynamic import.
      const { downloadPollAsExcel } = await import("./export-utils");
      
      const mockAiStatus = {
        status: "COMPLETED",
        score: 85,
        summary: "Strong indicators",
        personaFeedback: [{ name: "Anna", role: "Designer", quote: "Love it" }],
        sources: [{ title: "Forbes", url: "https://forbes.com" }]
      };

      await downloadPollAsExcel(mockPoll, mockAiStatus);

      // Verify bookkeeping occurred
      expect(mockBookNew).toHaveBeenCalled();
      
      // Verify sheet generation happened for BOTH tabs (Results and AI Validation)
      expect(mockAoaToSheet).toHaveBeenCalledTimes(2);

      // Check contents of the first sheet generation call (General Results)
      const call1Args = mockAoaToSheet.mock.calls[0][0];
      expect(call1Args[1]).toContain("Test Poll & Results"); // Check title index
      // Check question rows
      expect(call1Args.some((row: any) => row.includes("Question One?"))).toBe(true);

      // Check contents of the second sheet generation call (AI Validation)
      const call2Args = mockAoaToSheet.mock.calls[1][0];
      expect(call2Args.some((row: any) => row.includes("Strong indicators"))).toBe(true);
      expect(call2Args.some((row: any) => row.includes("Anna"))).toBe(true);

      expect(mockBookAppendSheet).toHaveBeenCalledTimes(2);
      expect(mockBookAppendSheet).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), "General Results");
      expect(mockBookAppendSheet).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), "AI Validation");

      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockWriteFile.mock.calls[0][1]).toContain("votesphere-results-test-poll---results.xlsx");
    });
  });
});
