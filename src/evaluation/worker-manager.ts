import { Request, RequestEnvelope, Response, ResponseEnvelope } from "./worker";

export class WorkerManager {
  worker: Worker;
  idx: number;
  lookup: Map<
    number,
    {
      resolve: (response: Response | PromiseLike<Response>) => void;
    }
  >;

  constructor(worker: Worker) {
    this.worker = worker;
    this.idx = 0;
    this.lookup = new Map();
    worker.onmessage = (event: MessageEvent<ResponseEnvelope>) => {
      const resolver = this.lookup.get(event.data.unique);
      this.lookup.delete(event.data.unique);
      const response = event.data;
      if (resolver) {
        resolver.resolve(response);
      }
    };
  }

  coinUnique(): number {
    const freshIdx = this.idx;
    this.idx += 1;
    return freshIdx;
  }

  evaluate(request: Request): Promise<Response> {
    const unique = this.coinUnique();
    const promise = new Promise<Response>((resolve) => {
      this.lookup.set(unique, {
        resolve,
      });
    });

    const requestEnvelope: RequestEnvelope = { ...request, unique };
    this.worker.postMessage(requestEnvelope);
    return promise;
  }
}
