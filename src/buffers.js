async function createFVertices(folderName, depth) {
    if (!folderName) {
        console.error('Error: folderName is undefined or empty.');
        return;
    }

    const basePath = `./`+folderName;

    let preOrdinaryPointData = [];
    let preExtraBaseUVData = [];
    let extra_vertex_offsets = [];
    let extra_vertex_indexes = [];
    try {
        for(let i=0; i<=depth; i++)
        {
            const response1 = await fetch(`${basePath}/extra_ordinary${i}.txt`);
            // const response2 = await fetch(`${basePath}/${i + 1}.txt`);

            const text1 = await response1.text();
            // const text2 = await response2.text();

            // 두 파일의 줄을 합침
            const lines = [...text1.split('\n')];
            let dataArray1 = [];
            let dataArray2 = [];
            let extra_vertex_offset = [];
            let offset = 0;
            let extra_vertex_index = [];
            let lastIndex = 0;
            extra_vertex_offset.push(offset);
            // before: dataArray1 = dataArray1.concat(integers);
            // after:  dataArray1.push(...integers);

            for (const line of lines) {
            const parts    = line.trim().split(/\s+/);
            const ints     = parts.slice(0, 6).map(n => parseInt(n, 10));
            const deltas   = parts.slice(6, 12).map(n => parseInt(n, 10));
            const floats   = parts.slice(12).map(n => parseFloat(n));

            const currIdx = ints[0];
            if (currIdx !== lastIndex) {
                extra_vertex_index.push(0);
            } else {
                extra_vertex_index.push(extra_vertex_index[extra_vertex_index.length - 1] + 1);
            }
            lastIndex = currIdx;

            // 1) 정수들 한 번에 push
            dataArray1.push(...ints);

            // 2) 누적 offset 계산 & push
            for (const d of deltas) {
                offset += d;
                extra_vertex_offset.push(offset);
            }

            // 3) 소수들 한 번에 push
            dataArray2.push(...floats);
            }

            preOrdinaryPointData.push(new Uint32Array(dataArray1));
            preExtraBaseUVData.push(new Float32Array(dataArray2));
            extra_vertex_offsets.push(new Uint32Array(extra_vertex_offset));
            extra_vertex_indexes.push(new Uint32Array(extra_vertex_index));
    
    console.log("hihi");
        }
    } catch (error) {
        console.error('Error fetching extra_ordinary.txt:', error);
        return;
    }

    const OrdinaryPointData = preOrdinaryPointData;
    const extra_base_UV = preExtraBaseUVData;

    return {
        extra_base_UV,
        extra_vertex_offsets,
        extra_vertex_indexes,
        OrdinaryPointData
    };
}

function createBufferData(device, obj, level) {
    const vertex_F = new Int32Array(obj[level].data.f_indices);
    const offset_F = new Int32Array(obj[level].data.f_offsets);
    const valance_F = new Int32Array(obj[level].data.f_valances);
    const pointIdx_F = new Int32Array(obj[level].data.f_data);

    const vertex_E = new Int32Array(obj[level].data.e_indices);
    const pointIdx_E = new Int32Array(obj[level].data.e_data);

    const vertex_V = new Int32Array(obj[level].data.v_indices);
    const offset_V = new Int32Array(obj[level].data.v_offsets);
    const valance_V = new Int32Array(obj[level].data.v_valances);
    const index_V = new Int32Array(obj[level].data.v_index);
    const pointIdx_V = new Int32Array(obj[level].data.v_data);

    const size = vertex_F.byteLength*4 + vertex_E.byteLength*4 + vertex_V.byteLength*4;

    // Create buffers for face, edge, and vertex data
    const vertex_Buffer_F = device.createBuffer({size: vertex_F.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const offset_Buffer_F = device.createBuffer({size: offset_F.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const valance_Buffer_F = device.createBuffer({size: valance_F.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const pointIdx_Buffer_F = device.createBuffer({size: pointIdx_F.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});

    const vertex_Buffer_E = device.createBuffer({size: vertex_E.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const pointIdx_Buffer_E = device.createBuffer({size: pointIdx_E.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});

    const vertex_Buffer_V = device.createBuffer({size: vertex_V.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const offset_Buffer_V = device.createBuffer({size: offset_V.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const valance_Buffer_V = device.createBuffer({size: valance_V.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const index_Buffer_V = device.createBuffer({size: index_V.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const pointIdx_Buffer_V = device.createBuffer({size: pointIdx_V.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});

    // Write data to buffers
    device.queue.writeBuffer(vertex_Buffer_F, 0, vertex_F);
    device.queue.writeBuffer(offset_Buffer_F, 0, offset_F);
    device.queue.writeBuffer(valance_Buffer_F, 0, valance_F);
    device.queue.writeBuffer(pointIdx_Buffer_F, 0, pointIdx_F);

    device.queue.writeBuffer(vertex_Buffer_E, 0, vertex_E);
    device.queue.writeBuffer(pointIdx_Buffer_E, 0, pointIdx_E);

    device.queue.writeBuffer(vertex_Buffer_V, 0, vertex_V);
    device.queue.writeBuffer(offset_Buffer_V, 0, offset_V);
    device.queue.writeBuffer(valance_Buffer_V, 0, valance_V);
    device.queue.writeBuffer(index_Buffer_V, 0, index_V);
    device.queue.writeBuffer(pointIdx_Buffer_V, 0, pointIdx_V);

    return {
        vertex_Buffer_F,
        offset_Buffer_F,
        valance_Buffer_F,
        pointIdx_Buffer_F,
        vertex_Buffer_E,
        pointIdx_Buffer_E,
        vertex_Buffer_V,
        offset_Buffer_V,
        valance_Buffer_V,
        index_Buffer_V,
        pointIdx_Buffer_V,
        size,
    };
}

function forMakeBuffer(device, depth, patchLevel) {
    let texcoordDatas = [];
    let texcoordData_byteLengths = [];
    let indices = [];
    let index_byteLengths = [];
    function max(a, b) {return a > b ? a : b;}

    for (let i = 0; i <= depth; i++) {
        let N = max(2**(depth-i-patchLevel), 1);
        // let N = 1.0;
        let texcoordData = new Float32Array((N + 1) * (N + 1) * 2);
        let offset = 0;
        for (let row = 0; row <= N; ++row) {
            for (let col = 0; col <= N; ++col) {
                texcoordData[offset++] = (row / N);
                texcoordData[offset++] = (col / N);
            }
        }
        texcoordDatas.push(texcoordData);
        let texcoordData_byteLength = texcoordData.byteLength;
        texcoordData_byteLengths.push(texcoordData_byteLength);
        let index = new Uint32Array(N * N * 6);
        offset = 0;
        for (let row = 0; row < N; ++row) {
            for (let col = 0; col < N; ++col) {
                index[offset++] = (row + col * (N + 1));
                index[offset++] = (row + (col + 1) * (N + 1));
                index[offset++] = (row + col * (N + 1) + 1);
                index[offset++] = (row + col * (N + 1) + 1);
                index[offset++] = (row + (col + 1) * (N + 1));
                index[offset++] = ((row + 1) + (col + 1) * (N + 1));
            }
        }
        indices.push(index);
        let index_byteLength = index.byteLength;
        index_byteLengths.push(index_byteLength);
    }

    let vertexBuffers = [];
    let indexBuffers = [];

    for (let i = 0; i <= depth; i++) {
        const vertexBuffer = device.createBuffer({
            label: 'vertex buffer vertices',
            size: texcoordData_byteLengths[i],
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        const indexBuffer = device.createBuffer({
            label: 'index buffer',
            size: index_byteLengths[i],
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        vertexBuffers.push(vertexBuffer);
        indexBuffers.push(indexBuffer);
    }

    return { indices, texcoordDatas, indexBuffers, vertexBuffers }
}

function create_texture_buffers(device, depth)
{
    let texcoordDatasArray = [];
    let indicesArray = [];
    let indexBuffersArray = [];
    let vertexBuffersArray = [];

    for(let i=0; i<=depth; i++)
    {
        let { indices, texcoordDatas, indexBuffers, vertexBuffers } = forMakeBuffer(device, depth, i);
        texcoordDatasArray.push(texcoordDatas);
        indicesArray.push(indices);
        indexBuffersArray.push(indexBuffers);
        vertexBuffersArray.push(vertexBuffers);
    }

    let indices = indicesArray;
    let texcoordDatas = texcoordDatasArray;
    let indexBuffers = indexBuffersArray;
    let vertexBuffers = vertexBuffersArray;

    return { indices, texcoordDatas, indexBuffers, vertexBuffers }
}

async function create_image_texture_buffers(path, device)
{
    const img = document.createElement('img');
    img.src = path;
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    let texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height, 1]
    );

    return texture;
}

export function uniform_buffers(device)
{
    const uniformBufferSize = (36) * 4;
    let uniformBuffer = device.createBuffer({
        label: 'uniforms',
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    let uniformValues = new Float32Array(uniformBufferSize / 4);

    const kMatrixOffset = 0;
    const viewOffset = 16;
    const timeOffset = 20;
    const wireOffset = 24;
    const displacementOffset = 28;
    const colorOffset = 32;

    const matrixValue = uniformValues.subarray(kMatrixOffset, kMatrixOffset + 16);
    const viewValue = uniformValues.subarray(viewOffset, viewOffset + 4);
    const timeValue = uniformValues.subarray(timeOffset, timeOffset + 4);
    const wireValue = uniformValues.subarray(wireOffset, wireOffset + 4);
    const displacementValue = uniformValues.subarray(displacementOffset, displacementOffset + 4);
    const colorValue = uniformValues.subarray(colorOffset, colorOffset + 4);

    




    return { uniformBuffer, uniformValues, matrixValue, viewValue, timeValue, wireValue, displacementValue, colorValue };
}

export async function buffers(device, depth, obj, limit, myString){

    let { extra_base_UV, extra_vertex_offsets, extra_vertex_indexes, OrdinaryPointData } = await createFVertices(myString, depth);

    let levels = [];
    let levelsize = 0;

    let connectivityStorageBuffers = [];
    let base_UVStorageBuffers = [];
    let extra_base_UVStorageBuffers = [];
    let extra_vertex_offsetStorageBuffers = [];
    let extra_vertex_indexesStorageBuffers = [];

    for (let i=0; i<=depth; i++)
    {
        const level = createBufferData(device, obj, i);
        levelsize += level.size;
        levels.push(level);

        const extra_base_UVStorageBuffer = device.createBuffer({
            label: 'extra_base_UV buffer vertices',
            size: extra_base_UV[i].byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(extra_base_UVStorageBuffer, 0, extra_base_UV[i]);
        extra_base_UVStorageBuffers.push(extra_base_UVStorageBuffer);

        const extra_vertex_offsetStorageBuffer = device.createBuffer({
            label: 'extra_vertex_offset buffer vertices',
            size: extra_vertex_offsets[i].byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(extra_vertex_offsetStorageBuffer, 0, extra_vertex_offsets[i]);
        extra_vertex_offsetStorageBuffers.push(extra_vertex_offsetStorageBuffer);

        const extra_vertex_indexesStorageBuffer = device.createBuffer({
            label: 'extra_vertex_indexes buffer',
            size: extra_vertex_indexes[i].byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(extra_vertex_indexesStorageBuffer, 0, extra_vertex_indexes[i]);
        extra_vertex_indexesStorageBuffers.push(extra_vertex_indexesStorageBuffer);
    }

    const textureBuffer = device.createBuffer({
        label: 'texture buffer',
        size: levelsize / 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    const video = document.getElementById('webcam-video');
    let videoTexture;
    let videoSource;
    let videoWidth = 640;
    let videoHeight = 480;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();

        videoSource = video;

        videoTexture = device.createTexture({
            size: [video.videoWidth, video.videoHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
    } catch (error) {
        videoSource = {
            width: videoWidth,
            height: videoHeight,
            // `drawImage`를 대신 수행하는 캔버스 요소
            canvas: document.createElement('canvas'),
        };
        const ctx = videoSource.canvas.getContext('2d');
        videoSource.canvas.width = videoWidth;
        videoSource.canvas.height = videoHeight;

        videoTexture = device.createTexture({
            size: [videoWidth, videoHeight],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }


    let textures = [];
    textures.push(await create_image_texture_buffers(`./${myString}/d512.bmp`, device));
    textures.push(await create_image_texture_buffers(`./${myString}/n.bmp`, device));
    textures.push(videoTexture);
    textures.push(await create_image_texture_buffers(`./${myString}/d512.bmp`, device));

    let { indices, texcoordDatas, indexBuffers, vertexBuffers } = create_texture_buffers(device, depth)
    
    let sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',   // MIP 맵 필터링을 선형 보간으로 설정
    });

    let Base_Vertex_Buffer = device.createBuffer({
        label: 'Base_Vertex_Buffer',
        size : levelsize,
        usage : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });


    let Base_Normal_Buffer = device.createBuffer({
        label: 'Base_Normal_Buffer',
        size : levelsize,
        usage : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    let limit_Buffers = [];
    let limit_P;

    for (let i=0; i<=depth; i++)
    {
        limit_P = new Uint32Array(limit[i].data.flat());
        const limit_Buffer = device.createBuffer({
            label: 'limit_Buffer',
            size : limit_P.byteLength,
            usage : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });
        device.queue.writeBuffer(limit_Buffer, 0, limit_P);
        limit_Buffers.push(limit_Buffer);
    }

    const OrdinaryBuffer = device.createBuffer({
        label: 'OrdinaryBuffer',
        size: Base_Vertex_Buffer.size * 2,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const Base_Vertex_After_Buffer = device.createBuffer({
        label: 'BaseBuffer',
        size: Base_Vertex_Buffer.size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    return { 
        levels,
        connectivityStorageBuffers,
        base_UVStorageBuffers,
        extra_base_UVStorageBuffers,
        extra_vertex_offsetStorageBuffers,
        extra_vertex_indexesStorageBuffers,
        textureBuffer,
        indices,
        texcoordDatas,
        indexBuffers,
        vertexBuffers,
        Base_Vertex_Buffer,
        Base_Normal_Buffer,
        OrdinaryPointData,
        textures,
        videoSource,
        sampler,
        limit_Buffers,
        Base_Vertex_After_Buffer,
        OrdinaryBuffer
    }
}