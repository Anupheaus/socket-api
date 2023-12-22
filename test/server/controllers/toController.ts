import { ControllerContext, createToController } from '../../../src/server';

interface TestControllerContext extends ControllerContext {
  user?: {
    name: string;
  };
}

export const toController = createToController<TestControllerContext>();