import { expect, describe, it } from "@jest/globals";
import { generate, generateSimpleTask } from "../index";
import { TaskType, ForkJoinTaskDef, InlineEvaluatorType } from "../types";
import { generateEvaluationCode, generateInlineTask } from "../InlineTask";

describe("Generate", () => {
  describe("InlineTask", () => {
    describe("InputParameters ", () => {
      it("Should generate default inputParameters", () => {
        const generatedInputParameters = generateEvaluationCode();
        expect(generatedInputParameters).toEqual({
          value: "${workflow.input.value}",
          evaluatorType: "value-param",
          expression: "true",
        });
      });
      it("Should generate a javascript with defaults inputParameters", () => {
        const generatedInputParameters = generateEvaluationCode({
          evaluatorType: InlineEvaluatorType.JAVASCRIPT,
        });
        expect(generatedInputParameters).toEqual({
          value: "${workflow.input.value}",
          evaluatorType: "javascript",
          expression: "true",
        });
      });
      it("Should generate the expression if passed javascript code", () => {
        const generatedInputParameters = generateEvaluationCode({
          evaluatorType: InlineEvaluatorType.JAVASCRIPT,
          expression: function ($: any) {
            return function () {
              if ($.value === 1) {
                return { result: true };
              } else {
                return { result: false };
              }
            };
          },
        });
        expect(generatedInputParameters).toEqual({
          value: "${workflow.input.value}",
          evaluatorType: "javascript",
          expression:
            "(function () {\n                            if ($.value === 1) {\n                                return { result: true };\n                            }\n                            else {\n                                return { result: false };\n                            }\n                        })();",
        });
      });
    });
    it("Should generate an empty inline task", () => {
      const inlineTask = generateInlineTask();
      expect(inlineTask.name).toEqual(expect.stringContaining("inline"));
      expect(inlineTask.taskReferenceName).toEqual(
        expect.stringContaining("inline")
      );
      expect(inlineTask.taskReferenceName).toEqual(
        expect.stringContaining("ref")
      );
      expect(inlineTask.type).toEqual(TaskType.INLINE);
    });
    it("Should generate an inline task with name, and javascript as code", () => {
      const inlineTask = generateInlineTask({
        name: "coolTask",
        type: TaskType.INLINE,
        inputParameters: {
          value: "${workflow.param.value}",
          evaluatorType: InlineEvaluatorType.JAVASCRIPT,
          expression: function ($: any) {
            return function () {
              return true;
            };
          },
        },
      });
      expect(inlineTask.name).toEqual(expect.stringContaining("coolTask"));
      expect(inlineTask.taskReferenceName).toEqual(
        expect.stringContaining("coolTask_ref")
      );
      expect(inlineTask.taskReferenceName).toEqual(
        expect.stringContaining("ref")
      );
      expect(inlineTask.type).toEqual(TaskType.INLINE);
      expect(inlineTask.inputParameters.expression).toEqual(
        "(function () {\n                            return true;\n                        })();"
      );
    });
  });

  it("Should generate an empty workflow", () => {
    const wf = generate({});
    expect(wf.name).not.toBe("");
    expect(wf.tasks).toEqual([]);
  });

  it("Should generate a workflow with 3 simple tasks", () => {
    const wf = generate({
      tasks: [
        { type: TaskType.SIMPLE },
        { type: TaskType.SIMPLE },
        { type: TaskType.SIMPLE },
      ],
    });
    expect(wf.name).not.toBe("");
    expect(
      wf.tasks.every(
        ({ name, taskReferenceName, type }) =>
          name !== "" && taskReferenceName !== "" && type === TaskType.SIMPLE
      )
    ).toBe(true);
  });

  it("Should generate a workflow and take into account nested tasks", () => {
    const wf = generate({
      name: "tripReservation",
      tasks: [
        {
          type: TaskType.FORK_JOIN,
          forkTasks: [
            [
              {
                type: TaskType.HTTP,
                inputParameters: {
                  http_request: { uri: "http://airline1.com", method: "GET" },
                },
                name: "airline1",
              },
            ],
            [
              {
                type: TaskType.HTTP,
                inputParameters: {
                  http_request: { uri: "http://airline2.com", method: "GET" },
                },
                name: "airline2",
              },
            ],
            [
              {
                type: TaskType.HTTP,
                inputParameters: {
                  http_request: { uri: "http://airline3.com", method: "GET" },
                },
                name: "airline3",
              },
            ],
          ],
        },
        { type: TaskType.SIMPLE, name: "compute_lowest_price" },
        { type: TaskType.SIMPLE, name: "make_reservation" },
        generateSimpleTask({ name: "send_email" }),
      ],
    });
    expect(
      wf.tasks.every(
        ({ name, taskReferenceName }) => name !== "" && taskReferenceName !== ""
      )
    ).toBe(true);
    const [firstForkTask] = wf.tasks;
    expect(
      (firstForkTask as ForkJoinTaskDef).forkTasks
        .flat()
        .every(
          ({ name, taskReferenceName }) =>
            name !== "" && taskReferenceName !== ""
        )
    ).toBe(true);
  });
});
