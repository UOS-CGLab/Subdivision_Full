import { handleKeyUp, handleKeyDown } from './camera.js';

async function safeJson(response) {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    if (!text) throw new Error("Empty response body");
    return JSON.parse(text);
} 

export async function initializeWebGPU() {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
        throw new Error('Failed to get GPU adapter. Your browser might not support WebGPU.');
    }
    // await navigator.gpu.requestAdapter({
    //     powerPreference: "high-performance",  // 고성능 GPU를 우선적으로 선택
    //   }).then(adapter => {
    //     if (adapter) {
    //       console.log("GPU Adapter found:", adapter);
    //       // WebGPU 초기화 코드
    //     } else {
    //       console.error("No suitable GPU adapter found.");
    //     }
    //   });

    const canTimestamp = adapter.features.has('timestamp-query');
    const device = await adapter.requestDevice({
        requiredFeatures: [
            ...(canTimestamp ? ['timestamp-query'] : []),
        ],
    });

    if (!device) {
        throw new Error('Failed to get GPU device. Your browser might not support WebGPU.');
    }

    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleKeyDown);

    return { canvas, device, context, presentationFormat, canTimestamp };
}

export async function fetchData(myString) {
    // const topologyParts = [];
    // let partIndex = 1;
    // let partFetched = true;

    // while (partFetched) {
    //     try {
    //         const response = await fetch(`./${myString}/topology${partIndex}.json`);
    //         if (!response.ok) {
    //             partFetched = false; // Stop fetching if a part doesn't exist
    //             break;
    //         }
    //         const partData = await response.json();
    //         topologyParts.push(partData);
    //         partIndex++;
    //     } catch (error) {
    //         console.error("Error fetching topology part:", partIndex, error);
    //         partFetched = false;
    //     }
    // }
    // // Merge all parts into a single object
    // const obj = topologyParts.reduce((acc, part) => {
    //     // Assuming parts are arrays; modify this if the structure is different
    //     return acc.concat(part);
    // }, []);

    const data = await fetch('./' + myString + '/topology.json');
    const obj = await safeJson(data);

    const data2 = await fetch('./' + myString + '/base.json');
    const base = await safeJson(data2);

    const data3 = await fetch('./' + myString + '/limit_point.json');
    const limit = await safeJson(data3);

    const data4 = await fetch('./' + myString + '/base_normal.json');
    const base_normal = await safeJson(data4);

    const animationBase = await (await fetch('./../'+myString+'/animation/base.json')).json();

    const img = document.createElement('img');
    img.src = './'+myString+'/d512.bmp';
    await img.decode();

    let Base_Vertex =  new Float32Array(base.Base_Vertex);
    let Base_Normal = new Float32Array(base_normal.Base_Vertex);

    return { obj, Base_Vertex, Base_Normal, animationBase, limit };
}

export class TimingHelper {
  #device;
  #querySet;
  #resolveBuffer;
  #resultBuffer;
  #canTimestamp;
  #commandBuffer;
  #state = 'free';

  constructor(device) {
    this.#device = device;
    this.#canTimestamp = device.features.has('timestamp-query');

    if (!this.#canTimestamp) return;

    this.#querySet = device.createQuerySet({
      type: 'timestamp',
      count: 2,
    });

    this.#resolveBuffer = device.createBuffer({
      size: 2 * 8,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    });

    this.#resultBuffer = device.createBuffer({
      size: 2 * 8,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
  }

  get isSupported() {
    return this.#canTimestamp;
  }

  beginRenderPass(encoder, descriptor) {
    if (!this.#canTimestamp || this.#state !== 'free') {
      return encoder.beginRenderPass(descriptor);
    }

    this.#state = 'measuring';

    return encoder.beginRenderPass({
      ...descriptor,
      timestampWrites: {
        querySet: this.#querySet,
        beginningOfPassWriteIndex: 0,
        endOfPassWriteIndex: 1,
      },
    });
  }

  resolveAndSubmit(encoder) {
    if (!this.#canTimestamp || this.#state !== 'measuring') return null;

    encoder.resolveQuerySet(this.#querySet, 0, 2, this.#resolveBuffer, 0);
    encoder.copyBufferToBuffer(this.#resolveBuffer, 0, this.#resultBuffer, 0, 16);

    const commandBuffer = encoder.finish();
    this.#device.queue.submit([commandBuffer]);
    this.#commandBuffer = commandBuffer;
    this.#state = 'waiting';

    return commandBuffer;
  }

  async getResult() {
    if (!this.#canTimestamp || this.#state !== 'waiting') return 0;

    await this.#resultBuffer.mapAsync(GPUMapMode.READ);
    const times = new BigInt64Array(this.#resultBuffer.getMappedRange());
    const duration = Number(times[1] - times[0]);
    this.#resultBuffer.unmap();
    this.#state = 'free';

    return duration; // nanoseconds
  }
}