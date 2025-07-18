export async function createPipelines(device, presentationFormat) {

    const module_Face = device.createShaderModule({
        code: /*wgsl*/ `
        @group(0) @binding(0) var<storage, read> vertex_F: array<i32>;
        @group(0) @binding(1) var<storage, read> offset_F: array<i32>;
        @group(0) @binding(2) var<storage, read> valance_F: array<i32>;
        @group(0) @binding(3) var<storage, read> pointIdx_F: array<i32>;
        @group(0) @binding(4) var<storage, read_write> baseVertex: array<f32>;
        @group(0) @binding(5) var<storage, read_write> baseNormal: array<f32>;


        @compute @workgroup_size(256)
        fn compute_FacePoint(@builtin(global_invocation_id) global_invocation_id: vec3<u32>){
            let id = global_invocation_id.x;
            let start = u32(vertex_F[0]*4);

            let index = vertex_F[id];
            let offset = offset_F[id];
            let valance = valance_F[id];

            var pos = vec3(0.0,0.0,0.0);
            var normal = vec3(0.0,0.0,0.0);

            for (var i=offset; i<offset+valance ; i++ ){
            pos.x = pos.x + ( baseVertex[pointIdx_F[i]*4]) / f32(valance);
            pos.y = pos.y + ( baseVertex[(pointIdx_F[i]*4)+1] / f32(valance));
            pos.z = pos.z + ( baseVertex[(pointIdx_F[i]*4)+2] / f32(valance));
            }

            baseVertex[start+id*4] = pos.x;
            baseVertex[start+id*4+1] = pos.y;
            baseVertex[start+id*4+2] = pos.z;
            baseVertex[start+id*4+3] = 0;

            for (var i=offset; i<offset+valance ; i++ ){
            normal.x = normal.x + ( baseNormal[pointIdx_F[i]*4]) / f32(valance);
            normal.y = normal.y + ( baseNormal[(pointIdx_F[i]*4)+1] / f32(valance));
            normal.z = normal.z + ( baseNormal[(pointIdx_F[i]*4)+2] / f32(valance));
            }

            baseNormal[start+id*4] = normal.x;
            baseNormal[start+id*4+1] = normal.y;
            baseNormal[start+id*4+2] = normal.z;
            baseNormal[start+id*4+3] = 0;
        }
        `
    });

    const module_Edge = device.createShaderModule({
        code: /*wgsl*/ `
        @group(0) @binding(0) var<storage, read> vertex_E: array<i32>;
        @group(0) @binding(1) var<storage, read> pointIdx_E: array<i32>;
        @group(0) @binding(2) var<storage, read_write> baseVertex: array<f32>;
        @group(0) @binding(3) var<storage, read_write> baseNormal: array<f32>;

        @compute @workgroup_size(256)
        fn compute_EdgePoint(@builtin(global_invocation_id) global_invocation_id: vec3<u32>){
            let id = global_invocation_id.x;
            let start2 = u32(vertex_E[0]*4);

            let index = vertex_E[id];
            let offset = 4*id;

            var pos = vec3(0.0,0.0,0.0);
            var normal = vec3(0.0,0.0,0.0);

            for (var i=offset; i<offset+4 ; i++ ){
            pos.x = pos.x + ( baseVertex[pointIdx_E[i]*4]) / 4;
            pos.y = pos.y + ( baseVertex[(pointIdx_E[i]*4)+1] ) / 4;
            pos.z = pos.z + ( baseVertex[(pointIdx_E[i]*4)+2] ) / 4;
            }

            baseVertex[start2+id*4] = pos.x;
            baseVertex[start2+id*4+1] = pos.y;
            baseVertex[start2+id*4+2] =pos.z;
            baseVertex[start2+id*4+3] = 0;

            for (var i=offset; i<offset+4 ; i++ ){
            normal.x = normal.x + ( baseNormal[pointIdx_E[i]*4]) / 4;
            normal.y = normal.y + ( baseNormal[(pointIdx_E[i]*4)+1] ) / 4;
            normal.z = normal.z + ( baseNormal[(pointIdx_E[i]*4)+2] ) / 4;
            }

            baseNormal[start2+id*4] = normal.x;
            baseNormal[start2+id*4+1] = normal.y;
            baseNormal[start2+id*4+2] =normal.z;
            baseNormal[start2+id*4+3] = 0;
        }
        `
    });

    const module_Vertex = device.createShaderModule({
        code: /*wgsl*/ `
        @group(0) @binding(0) var<storage, read> vertex_V: array<i32>;
        @group(0) @binding(1) var<storage, read> offset_V: array<i32>;
        @group(0) @binding(2) var<storage, read> valance_V: array<i32>;
        @group(0) @binding(3) var<storage, read> index_V: array<i32>;
        @group(0) @binding(4) var<storage, read> pointIdx_V: array<i32>;
        @group(0) @binding(5) var<storage, read_write> baseVertex: array<f32>;
        @group(0) @binding(6) var<storage, read_write> baseNormal: array<f32>;


        @compute @workgroup_size(256)
        fn compute_VertexPoint(@builtin(global_invocation_id) global_invocation_id: vec3<u32>){
            let id = global_invocation_id.x;
            let start = u32(vertex_V[0]*4);

            let index = vertex_V[id];
            let oldIndex = index_V[id];
            let offset = offset_V[id];
            let valance = valance_V[id]/2;

            var pos = vec3(0.0,0.0,0.0);
            var normal = vec3(0.0,0.0,0.0);

            for (var i=offset; i<offset+(valance*2) ; i++ ){
            pos.x = pos.x + ( baseVertex[pointIdx_V[i]*4]) / (f32(valance)*f32(valance));
            pos.y = pos.y + ( baseVertex[(pointIdx_V[i]*4)+1] ) / (f32(valance)*f32(valance));
            pos.z = pos.z + ( baseVertex[(pointIdx_V[i]*4)+2] ) / (f32(valance)*f32(valance));
            }

            baseVertex[start+id*4] = (pos.x + (baseVertex[oldIndex*4] * (f32(valance-2)/f32(valance))));
            baseVertex[start+id*4+1] = pos.y + (baseVertex[oldIndex*4+1] * (f32(valance-2)/f32(valance)));
            baseVertex[start+id*4+2] = pos.z + (baseVertex[oldIndex*4+2] * (f32(valance-2)/f32(valance)));
            baseVertex[start+id*4+3] = 0;

            for (var i=offset; i<offset+(valance*2) ; i++ ){
            normal.x = normal.x + ( baseNormal[pointIdx_V[i]*4]) / (f32(valance)*f32(valance));
            normal.y = normal.y + ( baseNormal[(pointIdx_V[i]*4)+1] ) / (f32(valance)*f32(valance));
            normal.z = normal.z + ( baseNormal[(pointIdx_V[i]*4)+2] ) / (f32(valance)*f32(valance));
            }

            baseNormal[start+id*4] = (normal.x + (baseNormal[oldIndex*4] * (f32(valance-2)/f32(valance))));
            baseNormal[start+id*4+1] = normal.y + (baseNormal[oldIndex*4+1] * (f32(valance-2)/f32(valance)));
            baseNormal[start+id*4+2] = normal.z + (baseNormal[oldIndex*4+2] * (f32(valance-2)/f32(valance)));
            baseNormal[start+id*4+3] = 0;
        }
        `
    });

    /*for limit*/
    const module_Limit = device.createShaderModule({
        code: /*wgsl*/ `
        @group(0) @binding(0) var<storage, read_write> baseVertex: array<f32>;
        @group(0) @binding(1) var<storage, read_write> limitData: array<i32>;
        @group(0) @binding(2) var<storage, read_write> baseNormal: array<vec4f>;


        @compute @workgroup_size(256)
        fn compute_LimitPoint(@builtin(global_invocation_id) global_invocation_id: vec3<u32>){
            let id = global_invocation_id.x;
            let limitIdx= limitData[id*9];

            var limPos = vec3(baseVertex[4*limitIdx], baseVertex[4*limitIdx+1], baseVertex[4*limitIdx+2]);

            let e0 = vec3(baseVertex[4*limitData[id*9+1]],baseVertex[4*limitData[id*9+1]+1],baseVertex[4*limitData[id*9+1]+2]);
            let e1 = vec3(baseVertex[4*limitData[id*9+3]],baseVertex[4*limitData[id*9+3]+1],baseVertex[4*limitData[id*9+3]+2]);
            let e2 = vec3(baseVertex[4*limitData[id*9+5]],baseVertex[4*limitData[id*9+5]+1],baseVertex[4*limitData[id*9+5]+2]);
            let e3 = vec3(baseVertex[4*limitData[id*9+7]],baseVertex[4*limitData[id*9+7]+1],baseVertex[4*limitData[id*9+7]+2]);


            let f0 = vec3(baseVertex[4*limitData[id*9+2]],baseVertex[4*limitData[id*9+2]+1],baseVertex[4*limitData[id*9+2]+2]);
            let f1 = vec3(baseVertex[4*limitData[id*9+4]],baseVertex[4*limitData[id*9+4]+1],baseVertex[4*limitData[id*9+4]+2]);
            let f2 = vec3(baseVertex[4*limitData[id*9+6]],baseVertex[4*limitData[id*9+6]+1],baseVertex[4*limitData[id*9+6]+2]);
            let f3 = vec3(baseVertex[4*limitData[id*9+8]],baseVertex[4*limitData[id*9+8]+1],baseVertex[4*limitData[id*9+8]+2]);

            let edge_sum = e0+e1+e2+e3;
            let face_sum = f0+f1+f2+f3;

            let c2 = 4*(e0-e2)+f0-f1-f2+f3;
            let c3 = 4*(e1-e3)+f1-f2-f3+f0;
            let normal = normalize(cross(c2,c3));

            baseVertex[limitIdx*4] = ((16*limPos.x) + 4*edge_sum.x + (face_sum.x))/36;
            baseVertex[limitIdx*4+1] = ((16*limPos.y) + 4*edge_sum.y + (face_sum.y))/36;
            baseVertex[limitIdx*4+2] = ((16*limPos.z) + 4*edge_sum.z + (face_sum.z))/36;
            baseVertex[limitIdx*4+3] = 0;

            baseNormal[limitIdx] = vec4f(normal, 0);
            baseNormal[0] = vec4f(0, 0, 0, 0);
        }
        `
    });

    const pipeline_Face = device.createComputePipeline({
        label: 'Face Point Compute Pipeline',
        layout: 'auto',
        compute: {
            module: module_Face,
            entryPoint: 'compute_FacePoint',
        },
    });

    const pipeline_Edge = device.createComputePipeline({
        label: 'Edge Point Compute Pipeline',
        layout: 'auto',
        compute: {
            module: module_Edge,
            entryPoint: 'compute_EdgePoint',
        },
    });

    const pipeline_Vertex = device.createComputePipeline({
        label: 'Vertex Point Compute Pipeline',
        layout: 'auto',
        compute: {
            module: module_Vertex,
            entryPoint: 'compute_VertexPoint',
        },
    });

    /*for Limit*/
    const pipeline_Limit = device.createComputePipeline({
        label: 'Limit Point Compute Pipeline',
        layout: 'auto',
        compute: {
            module: module_Limit,
            entryPoint: 'compute_LimitPoint',
        },
    });


    const module_webCam = device.createShaderModule({
        code: /*wgsl*/ `
        struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
        };

        @group(0) @binding(0) var videoTexture: texture_2d<f32>;
        @group(0) @binding(1) var videoSampler: sampler;

        @vertex fn vs(
            @builtin(vertex_index) vertexIndex: u32,
        ) -> VertexOutput {
            var positions = array<vec2f, 3>(
                vec2f(-1.0, -1.0),
                vec2f(3.0, -1.0),
                vec2f(-1.0, 3.0),
            );
            var uv = array<vec2f, 3>(
                vec2f(0.0, 0.0),
                vec2f(2.0, 0.0),
                vec2f(0.0, 2.0),
            );

            var output: VertexOutput;
            output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
            output.uv = uv[vertexIndex];
            return output;
        }

        @fragment fn fs(@location(0) uv: vec2f) -> @location(0) vec4f {
            return textureSample(videoTexture, videoSampler, uv);
        }
        `,
    });


    // extra



    const module2 = device.createShaderModule({
        code: /*wgsl*/ `
        struct Uniforms {
            matrix: mat4x4f,
            view: vec4f,
            time: vec4f,
            wireAdjust: vec4f,
            displacementValue: vec4f,
            color: vec4f,
        };

        struct Vertex {
            @location(0) position : vec4f,
        };

        struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) color: vec4f,
            @location(1) normal: vec3f,
            @location(2) position2: vec3f,
            @location(3) texcoord: vec2f,
            @location(4) texcoord1: vec2f,
            @location(5) view: vec3f,
            @location(6) mappingNormal: vec3f,
        };

        fn getTexture(texture: texture_2d<f32>, sampler: sampler, uv: vec2f, level: f32) -> vec4f
        {
            return textureSampleLevel(texture, sampler, uv, level);
            // return textureLoad(texture, vec2i(uv*511), i32(level));
        }

        fn cotangent_frame(normal: vec3f, tangent: vec3f, bitangent: vec3f) -> mat3x3f {
            return mat3x3f(tangent, bitangent, normal);
        }
        
        fn perturb_normal(texture: texture_2d<f32>, sampler: sampler, normal: vec3f, uv: vec2f) -> vec3f {
            let normal_map = getTexture(texture, sampler, uv, 0).xyz - vec3f(0.5);
        
            // TBN 매트릭스 계산
            let tangent = normalize(dpdx(vec3f(uv, 0.0))); // Tangent (x축)
            let bitangent = normalize(dpdy(vec3f(uv, 0.0))); // Bitangent (y축)
            let TBN = cotangent_frame(normal, tangent, bitangent);
        
            return normalize(TBN * normal_map);
        }

        @group(0) @binding(0) var<uniform> uni: Uniforms;
        @group(0) @binding(1) var<storage, read> extra_index_storage_buffer: array<u32>;
        @group(0) @binding(2) var<storage, read> extra_base_UV: array<vec2f>;
        @group(0) @binding(3) var<storage, read> extra_vertex_offset: array<i32>;
        @group(0) @binding(4) var<storage, read> extra_vertex_indexes: array<i32>;
        @group(0) @binding(5) var object_texture: texture_2d<f32>;
        @group(0) @binding(6) var object_normal_texture: texture_2d<f32>;
        @group(0) @binding(7) var webCam_texture: texture_2d<f32>;
        @group(0) @binding(8) var object_color_texture: texture_2d<f32>;
        @group(0) @binding(9) var sampler0: sampler;
        @group(0) @binding(10) var<storage, read> base_vertex: array<vec4f>;
        @group(0) @binding(11) var<storage, read> base_normal: array<vec4f>;

        @vertex fn vs(
            @builtin(vertex_index) vertexIndex: u32,
            @builtin(instance_index) instanceIndex: u32,
            vert: Vertex,
        ) -> VSOutput {
            var vsOut: VSOutput;

            _ = base_normal[0].x;
            _ = extra_base_UV[0].x;
            _ = object_texture;
            _ = object_normal_texture;
            _ = webCam_texture;
            _ = object_color_texture;
            _ = sampler0;
            _ = extra_index_storage_buffer[0];
            _ = base_vertex[0].x;
            _ = uni.matrix[0];
            _ = extra_vertex_offset[0];
            _ = extra_vertex_indexes[0];

            // var normal = -base_normal[extra_index_storage_buffer[vertexIndex]].xyz;
            var normal = base_normal[extra_index_storage_buffer[vertexIndex]].xyz;

            let index = extra_vertex_offset[vertexIndex];
            var vertex_count = extra_vertex_offset[vertexIndex+1] - extra_vertex_offset[vertexIndex];

            var sum: f32 = 0.0;
            var normalTextureSum: vec3f = vec3f(0);
            // var normalSum: vec3f = vec3f(0);
            for(var i=0; i<vertex_count; i++)
            {
                sum = sum + getTexture(object_texture, sampler0, vec2f(extra_base_UV[index+i].x, (1-extra_base_UV[index+i].y)), 0).x;
                normalTextureSum = normalTextureSum + getTexture(object_normal_texture, sampler0, vec2f(extra_base_UV[index+i].x, (1-extra_base_UV[index+i].y)), 0).xyz;
                // if(vertexIndex % 6 == 0)
                // {
                //     normalSum = normalSum -base_normal[extra_index_storage_buffer[i32(vertexIndex)+1 + 6*(i - i32(extra_vertex_indexes[vertexIndex/6]))]].xyz;
                // }
            }
            // if(vertexIndex % 6 == 0)
            // {
            //     normal = normalSum / f32(vertex_count);
            // }
            let textureValue = sum / f32(vertex_count);
            let normalTexture = normalTextureSum / f32(vertex_count);
            
            let uv = extra_base_UV[extra_vertex_offset[vertexIndex]];
            vsOut.texcoord = vec2f(uv.x, 1-uv.y);
            vsOut.texcoord1 = vec2f(textureValue, 0);
            vsOut.mappingNormal = normalize(normalTexture - vec3f(0.5));
            let texCoordInt = vec2i(  i32(uv.x),  i32((1-uv.y))  );

            // let p = vert.position.xyz;
            let p = vec3f(base_vertex[extra_index_storage_buffer[vertexIndex]].xyz);
            
            vsOut.position = uni.matrix * vec4f(p*5 + normal*(textureValue-0.5)*(uni.displacementValue.x), 1);

            // vsOut.position = uni.matrix * vec4f(p*5, 1);
            // vsOut.texcoord = vec2f(0);
            // vsOut.texcoord1= vec2f(0);
            vsOut.position2 = normalize(p.xyz);
            vsOut.normal = normal;
            vsOut.color = vec4f(0.5, 0.5, 1, 1);
            vsOut.view = normalize(  uni.view.xyz - p  );
            return vsOut;
        }

        @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
            var return_color: vec4f;
            let view = vsOut.view;

            // TBN 매트릭스 계산
            let tangent = normalize(dpdx(vec3f(vsOut.position2))); // Tangent (x축)
            let bitangent = normalize(dpdy(vec3f(vsOut.position2))); // Bitangent (y축)
            let TBN = cotangent_frame(vsOut.normal, tangent, bitangent);
            
            // let normal = perturb_normal(object_normal_texture, sampler0, vsOut.normal, vsOut.texcoord);
            // let normal = vsOut.mappingNormal; // normalize(TBN * vsOut.mappingNormal);
            let normal = normalize(TBN * vsOut.mappingNormal);

            if(uni.color.x == 0) { return_color =  vec4f(vsOut.position2.xyz, 1); }
            else if(uni.color.x == 1) { return_color = vec4f(normal, 1); }
            else if(uni.color.x == 4) { return_color = vec4f(vsOut.texcoord1.xxx*5-2.5, 1); }
            // else if(uni.color.x == 8) { return_color = getTexture(object_normal_texture, sampler0, vsOut.texcoord, 0); }
            // else if(uni.color.x == 8) { return_color = vec4f(0.753, 0.753, 0.753, 1.0); }
            // else if(uni.color.x == 8) { return_color = vec4f(0, 0.5, 0, 1.0); }
            // else if(uni.color.x == 8) { return_color = getTexture(webCam_texture, sampler0, vsOut.position2.yz, 0); }
            else { return_color = vec4f(vsOut.color); }
            if(uni.color.y == 1)
            {
                let temp_light = dot(view, normal)*0.5;
                return_color += return_color * vec4f(temp_light, temp_light, temp_light, 0) / 2;
                if(dot(view, normal) > 0)
                {
                    let highlight = vec3f((pow(dot(view, normal), 100)*0.2), (pow(dot(view, normal), 100)*0.2), (pow(dot(view, normal), 100)*0.2));
                    return_color += vec4f(highlight, 1);
                }
            }
            // if(uni.color.x == 8) //green_hover
            // {
            //     var l:vec3f = normalize(vsOut.view.xyz);
            //     var n = normal;
            //     var l_dot_n: f32 = max(dot(l, n), 0.0);
            //     var ambient: vec3f = vec3f(0.0, 0.05, 0.0);
            //     var diffuse: vec3f = vec3f(0.4, 0.5, 0.4) * l_dot_n;
            //     var specular: vec3f = vec3f(0, 0, 0);
            //     if(l_dot_n > 0)
            //     {
            //         specular = vec3f(0.04,0.7,0.04) * pow(max(dot(l, n), 0), 2.5);
            //     }
            //     return_color = vec4f((ambient + diffuse + specular), 1.0);
            // }
            if(uni.color.x == 8)
            {
                // let lightDir = normalize(vec3f(0.3, 0.5, 0.8)); // 원하는 광원 방향
                let lightDir = normalize(vsOut.view.xyz);
                let viewDir = normalize(vsOut.view.xyz);

                let lambert = max(dot(normal, lightDir), 0.0);

                let ambient = vec3f(0.05, 0.1, 0.05);
                let diffuse = vec3f(0.2, 0.8, 0.2) * lambert;

                let halfway = normalize(lightDir + viewDir);
                let spec = pow(max(dot(normal, halfway), 0.0), 32.0);
                let specular = vec3f(0.4, 0.9, 0.4) * spec;

                return_color = vec4f(ambient + diffuse + specular, 1.0);
            }
            return return_color;
        }
        `,
    });

    const moduleAnime = device.createShaderModule({
        code: /*wgsl*/ `
        struct Uniforms {
            matrix: mat4x4f,
            view: vec4f,
            time: vec4f,
            wireAdjust: vec4f,
            displacementValue: vec4f,
            color: vec4f,
        };

        @group(0) @binding(0) var<uniform> uni: Uniforms;
        @group(0) @binding(1) var<storage, read_write> baseVertex: array<vec4f>;

        fn rotationMatrixZ(angle: f32) -> mat4x4f {
            let c = cos(angle);
            let s = sin(angle);
            return mat4x4f(
                vec4f(c, s, 0.0, 0.0),
                vec4f(-s, c, 0.0, 0.0),
                vec4f(0.0, 0.0, 1.0, 0.0),
                vec4f(0.0, 0.0, 0.0, 1.0)
            );
        }

        @compute @workgroup_size(256) fn cs(@builtin(global_invocation_id) global_invocation_id: vec3<u32>){
            let id = global_invocation_id.x;
            let time = uni.time.x;

            // baseVertex[id].y = sin(time*f32(id)/100)+cos(time*f32(id)/100) + (baseVertex[id].x + baseVertex[id].z)/2;

            baseVertex[id] = rotationMatrixZ(sin(time)*baseVertex[id].z*0.03) * vec4f(baseVertex[id].xyz, 1.0);
        }
        `,
    });

    const pipeline_webCam = device.createRenderPipeline({
        label: 'pipeline_webCam',
        layout: 'auto',
        vertex: {
            module: module_webCam,
            entryPoint: 'vs',
        },
        fragment: {
            module: module_webCam,
            entryPoint: 'fs',
            targets: [{ format: presentationFormat }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    const pipeline2 = device.createRenderPipeline({
        label: 'pipeline2',
        layout: 'auto',
        vertex: {
            module: module2,
            entryPoint: 'vs',
            buffers: [
                {
                    arrayStride: (4) * 4, // (4) floats, 4 bytes each
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x4' },  // position
                    ],
                },
            ],
        },
        fragment: {
            module: module2,
            entryPoint: 'fs',
            targets: [{ format: presentationFormat }],
        },
        primitive: {
            // topology: 'line-list',
            listIndexFormat: 'uint32',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });

    const pipelineAnime = device.createComputePipeline({
        label: 'Animation! Compute Pipeline',
        layout: 'auto',
        compute: {
            module: moduleAnime,
            entryPoint: 'cs',
        },
    });
    
    return { pipeline_Face, pipeline_Edge, pipeline_Vertex, 
            pipeline_webCam, pipeline2, pipelineAnime, pipeline_Limit };
}
