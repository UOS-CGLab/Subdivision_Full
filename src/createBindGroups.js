export function createBindGroup(device, pipeline_Face, pipeline_Edge, pipeline_Vertex, Base_Vertex_Buffer, Base_Normal_Buffer, buffers, prefix) {
    const bindGroup_Face = device.createBindGroup({
        label: `bindGroup for face${prefix}`,
        layout: pipeline_Face.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: buffers.vertex_Buffer_F}},
            {binding: 1, resource: {buffer: buffers.offset_Buffer_F}},
            {binding: 2, resource: {buffer: buffers.valance_Buffer_F}},
            {binding: 3, resource: {buffer: buffers.pointIdx_Buffer_F}},
            {binding: 4, resource: {buffer: Base_Vertex_Buffer}},
            {binding: 5, resource: {buffer: Base_Normal_Buffer}}
        ],
    });

    const bindGroup_Edge = device.createBindGroup({
        label: `bindGroup for Edge${prefix}`,
        layout: pipeline_Edge.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: buffers.vertex_Buffer_E}},
            {binding: 1, resource: {buffer: buffers.pointIdx_Buffer_E}},
            {binding: 2, resource: {buffer: Base_Vertex_Buffer}},
            {binding: 3, resource: {buffer: Base_Normal_Buffer}}
        ],
    });

    const bindGroup_Vertex = device.createBindGroup({
        label: `bindGroup for vertex${prefix}`,
        layout: pipeline_Vertex.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: buffers.vertex_Buffer_V}},
            {binding: 1, resource: {buffer: buffers.offset_Buffer_V}},
            {binding: 2, resource: {buffer: buffers.valance_Buffer_V}},
            {binding: 3, resource: {buffer: buffers.index_Buffer_V}},
            {binding: 4, resource: {buffer: buffers.pointIdx_Buffer_V}},
            {binding: 5, resource: {buffer: Base_Vertex_Buffer}},
            {binding: 6, resource: {buffer: Base_Normal_Buffer}}
        ],
    });

    return {
        bindGroup_Face,
        bindGroup_Edge,
        bindGroup_Vertex
    };
}

export async function extraBindGroup(device, uniformBuffer, OrdinaryPointData, Base_Vertex_Buffer, Base_Normal_Buffer, textures, sampler,
    extra_base_UVStorageBuffers, extra_vertex_offsetStorageBuffers, extra_vertex_indexesStorageBuffers, pipeline2, depth, settings)
{
    let OrdinaryPointBuffers = [];
    let OrdinaryStorageBuffers = [];
    for(let i=0; i<=depth; i++)
    {
        OrdinaryPointBuffers.push(device.createBuffer({
            label: 'ordinary index buffer',
            size: OrdinaryPointData[i].byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        }));
        device.queue.writeBuffer(OrdinaryPointBuffers[i], 0, OrdinaryPointData[i]);
        OrdinaryStorageBuffers.push(device.createBuffer({
            label: 'ordinary index storage buffer',
            size: OrdinaryPointData[i].byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }));
        device.queue.writeBuffer(OrdinaryStorageBuffers[i], 0, OrdinaryPointData[i]);
    }

    const OrdinaryPointfixedBindGroup = device.createBindGroup({
        label: 'bind group for pipe2',
        layout: pipeline2.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: OrdinaryStorageBuffers[settings.getProterty('ordinaryLevel')] } },
            { binding: 2, resource: { buffer: extra_base_UVStorageBuffers[settings.getProterty('ordinaryLevel')] } },
            { binding: 3, resource: { buffer: extra_vertex_offsetStorageBuffers[settings.getProterty('ordinaryLevel')] } },
            { binding: 4, resource: { buffer: extra_vertex_indexesStorageBuffers[settings.getProterty('ordinaryLevel')] } },
            { binding: 5, resource: textures[0].createView() },
            { binding: 6, resource: textures[1].createView() },
            { binding: 7, resource: textures[2].createView() },
            { binding: 8, resource: textures[3].createView() },
            { binding: 9, resource: sampler },
            { binding: 10, resource: { buffer: Base_Vertex_Buffer } },
            { binding: 11, resource: { buffer: Base_Normal_Buffer } },
        ],
    });

    return OrdinaryPointfixedBindGroup;
}

export async function createBindGroup_Limit(device, pipeline_Limit, Base_Vertex_After_Buffer, Base_Normal_Buffer, limit_Buffers, settings)
{
    const bindGroup_Limit = device.createBindGroup({
        label: `bindGroup for Limit`,
        layout: pipeline_Limit.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: Base_Vertex_After_Buffer}},
            {binding: 1, resource: {buffer: limit_Buffers[settings.getProterty('ordinaryLevel')]}},
            {binding: 2, resource: {buffer: Base_Normal_Buffer}},
        ],
    });

    // const readBuffer = device.createBuffer({
    //     size: 4000,
    //     usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    //     });
    
    // // 2. GPU에서 데이터 복사
    // const commandEncoder = device.createCommandEncoder();
    // commandEncoder.copyBufferToBuffer(
    // limit_Buffers[settings.getProterty('ordinaryLevel')],    // 소스 버퍼 (GPU 연산 결과가 저장된 버퍼)
    // 0,            // 소스 버퍼의 오프셋
    // readBuffer,   // 대상 버퍼 (CPU에서 읽을 수 있는 버퍼)
    // 0,            // 대상 버퍼의 오프셋
    // 1000    // 복사할 데이터의 크기
    // );
    // const commands = commandEncoder.finish();
    // device.queue.submit([commands]);

    // // GPU 작업 완료 대기 후 버퍼 맵핑 및 읽기
    // device.queue.onSubmittedWorkDone().then(async () => {
    //     await readBuffer.mapAsync(GPUMapMode.READ);
    //     const arrayBuffer = readBuffer.getMappedRange();
    //     const data = new Uint32Array(arrayBuffer);
    //     console.log('Read data:', data);
    //     readBuffer.unmap();
    // }).catch((error) => {
    //     console.error('Error reading buffer:', error);
    // });

    return bindGroup_Limit;
}