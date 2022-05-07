import {test} from "@jest/globals"

import {RunnerArgs, TaskRunner} from "../TaskRunner"
import {TaskClient} from "../TaskClient"
import {ConductorLogger} from "../../common/ConductorLogger"
import {sleep} from "../sleep"
import {TaskResultStatus} from "../types"

const stub: Pick<TaskClient, "pollTask" | "updateTask"> = {
  pollTask: jest.fn(),
  updateTask: jest.fn()
}
const mockTaskClient = stub as unknown as TaskClient
const mockLogger: ConductorLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}

class Worker {
  taskType = ""
}

test('works tasks', async () => {
  const args: RunnerArgs = {
    taskType: "test",
    worker: async ({inputData}) =>  {
      return {
        outputData: {
          "hi": "there",
          ...inputData
        },
        status: TaskResultStatus.COMPLETED
      }
    },
    runnerOptions: {
      pollingIntervals: 10,
      workerID: "test"
    },
    logger: mockLogger,
    client: mockTaskClient
  }
  const runner = new TaskRunner(args)
  runner.pollAndRepeat()
  await sleep(50)
  runner.stopPolling()
})