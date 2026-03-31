'use client';

import React, { useEffect, useRef } from 'react';

const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Vertex shader source code - simple passthrough
  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  // Fragment shader source code - electric plasma pattern
  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    // 1D noise for the lightning logic
    float hash(float x) {
      return fract(sin(x * 100.0) * 43758.5453123);
    }
    
    float noise(float x) {
      float i = floor(x);
      float f = fract(x);
      return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, f));
    }
    
    // Fractal Brownian Motion (FBM)
    float fbm(float x) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(x);
        x *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Normalize pixel coordinates (from 0 to 1)
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      
      // Shift center to (0,0) and account for aspect ratio
      vec2 p = uv * 2.0 - 1.0;
      p.x *= iResolution.x / iResolution.y;
      
      // Base background color (Dark Navy/Slate mixing to match dashboard dark mode)
      vec3 bgColor = mix(vec3(0.03, 0.04, 0.1), vec3(0.01, 0.01, 0.03), uv.y);
      
      // Accumulate light from several electric "arcs"
      vec3 finalColor = bgColor;
      
      // Number of arcs
      const int numArcs = 4;
      
      for(int i = 0; i < numArcs; i++) {
        float fi = float(i);
        
        // Time varied for each arc so they don't move in sync
        float t = iTime * (0.4 + 0.1 * fi);
        
        // Offset Y position per arc using fbm noise
        // The x-coordinate has noise applied to it to make wavy lines
        float noiseVal = fbm(p.x * 2.0 + t * 2.0 + fi * 50.0);
        
        // Make the line stay roughly near the center but wiggle randomly
        float yCenter = (noiseVal - 0.5) * 1.5;
        
        // Pulsing amplitude (electricity surges and weakens)
        float pulse = sin(t * 5.0 + fi) * 0.5 + 0.5;
        
        // Distance from current pixel to this arc
        float dist = abs(p.y - yCenter);
        
        // Glow intensity (inverse distance) - creates the soft bloom of light
        float glow = 0.008 / (dist + 0.002) * pulse;
        
        // The electric color -- bluish-purple to neon blue
        vec3 arcColor = mix(vec3(0.2, 0.5, 1.0), vec3(0.5, 0.2, 0.9), fi / float(numArcs));
        
        // Additive blending for the glow, kept subtle so dashboard text is readable
        finalColor += arcColor * glow * 0.15; 
      }
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // Helper function to compile shader
  const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error: ', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  // Initialize shader program
  const initShaderProgram = (gl: WebGLRenderingContext, vsSource: string, fsSource: string) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return null;

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Shader program link error: ', gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // We can cast here as we know we're grabbing the webgl context
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported.');
      return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        time: gl.getUniformLocation(shaderProgram, 'iTime'),
      },
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = Date.now();
    let animationFrameId: number;

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(programInfo.program);

      // Make sure uniformLocations are not null before setting
      if (programInfo.uniformLocations.resolution) {
        gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
      }
      if (programInfo.uniformLocations.time) {
        gl.uniform1f(programInfo.uniformLocations.time, currentTime);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [vsSource, fsSource]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-50 pointer-events-none" 
      aria-hidden="true"
    />
  );
};

export default ShaderBackground;
