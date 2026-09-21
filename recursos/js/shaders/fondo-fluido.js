export const shaderVertices = `
    attribute vec2 aPosicion;

    void main() {
        gl_Position = vec4(aPosicion, 0.0, 1.0);
    }
`;

export const shaderFragmentos = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
    #else
        precision mediump float;
    #endif

    uniform vec2  uResolucion;
    uniform float uScroll;
    uniform float uTemaClaro;

    const vec3 COLOR_FONDO     = vec3(0.020, 0.031, 0.027);
    const vec3 COLOR_PROFUNDO  = vec3(0.115, 0.172, 0.157);
    const vec3 COLOR_EUCALIPTO = vec3(0.506, 0.631, 0.596);
    const vec3 COLOR_GLACIAR   = vec3(0.482, 0.639, 0.698);
    const vec3 COLOR_NARANJA   = vec3(1.000, 0.647, 0.161);
    const vec3 COLOR_BLANCO    = vec3(0.976, 0.976, 0.968);
    const vec3 COLOR_TINTA     = vec3(0.055, 0.070, 0.066);

    float azar(vec2 punto) {
        return fract(sin(dot(punto, vec2(127.1, 311.7))) * 43758.5453);
    }

    float ruido(vec2 punto) {
        vec2 celda = floor(punto);
        vec2 fraccion = fract(punto);
        vec2 curva = fraccion * fraccion * (3.0 - 2.0 * fraccion);

        float a = azar(celda);
        float b = azar(celda + vec2(1.0, 0.0));
        float c = azar(celda + vec2(0.0, 1.0));
        float d = azar(celda + vec2(1.0, 1.0));

        return mix(mix(a, b, curva.x), mix(c, d, curva.x), curva.y);
    }

    float fbm(vec2 punto) {
        float valor = 0.0;
        float amplitud = 0.5;
        mat2 rotacion = mat2(0.8, 0.6, -0.6, 0.8);

        for (int octava = 0; octava < 5; octava++) {
            valor += amplitud * ruido(punto);
            punto = rotacion * punto * 2.02 + vec2(1.7, 9.2);
            amplitud *= 0.5;
        }

        return valor;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / uResolucion;
        float aspecto = uResolucion.x / uResolucion.y;

        vec2 punto = vec2(uv.x * aspecto, uv.y - uScroll) * 1.6;

        vec2 q = vec2(
            fbm(punto),
            fbm(punto + vec2(5.2, 1.3))
        );

        vec2 r = vec2(
            fbm(punto + 3.2 * q + vec2(1.7, 9.2)),
            fbm(punto + 3.2 * q + vec2(8.3, 2.8))
        );

        float forma = fbm(punto + 3.6 * r);

        float densidad = smoothstep(0.3, 0.88, forma);
        float vetas = abs(fract(forma * 3.5 + r.x * 0.8) - 0.5) * 2.0;
        vetas = pow(1.0 - vetas, 28.0) * smoothstep(0.55, 0.85, forma);
        float pesoHorizontal = mix(1.0, 0.45, smoothstep(0.25, 1.0, uv.x));
        float vineta = smoothstep(1.25, 0.35, length((uv - vec2(0.42, 0.5)) * vec2(1.1, 1.3)));

        vec3 colorOscuro = mix(COLOR_FONDO, COLOR_PROFUNDO, densidad);
        colorOscuro = mix(colorOscuro, COLOR_EUCALIPTO, smoothstep(0.66, 1.0, forma) * 0.22);

        colorOscuro = mix(colorOscuro, COLOR_GLACIAR, clamp(length(q) - 0.9, 0.0, 1.0) * densidad * 0.08);

        colorOscuro += COLOR_EUCALIPTO * vetas * 0.06;

        float brasa = smoothstep(0.5, 0.66, fbm(punto * 0.9 + r * 0.35));
        brasa *= densidad * smoothstep(0.42, 0.66, forma);
        colorOscuro += COLOR_NARANJA * brasa * 0.14;

        colorOscuro += COLOR_NARANJA * vetas * brasa * 0.35;

        colorOscuro = mix(COLOR_FONDO, colorOscuro, pesoHorizontal);
        colorOscuro = mix(COLOR_FONDO * 0.6, colorOscuro, vineta);

        float alternancia = smoothstep(0.45, 0.62, r.y + (q.x - 0.5) * 0.6);
        vec3 tinta = mix(COLOR_TINTA, COLOR_EUCALIPTO * 0.72, alternancia * 0.55);

        float densidadClara = smoothstep(0.36, 0.9, forma);
        vec3 colorClaro = mix(COLOR_BLANCO, tinta, densidadClara * 0.62);
        colorClaro = mix(colorClaro, tinta, vetas * 0.3);

        colorClaro = mix(COLOR_BLANCO, colorClaro, mix(0.55, 1.0, vineta));

        float umbral = fbm(punto * 0.7 + r * 0.6);
        float avance = uTemaClaro * 1.3 - 0.15;
        float mezclaTema = smoothstep(umbral - 0.06, umbral + 0.06, avance);

        float borde = (1.0 - abs(mezclaTema * 2.0 - 1.0)) * step(0.001, uTemaClaro) * step(uTemaClaro, 0.999);
        vec3 colorBorde = mix(COLOR_EUCALIPTO, COLOR_NARANJA, alternancia * 0.6);

        vec3 color = mix(colorOscuro, colorClaro, mezclaTema);
        color = mix(color, colorBorde, borde * 0.5);

        color += (azar(gl_FragCoord.xy) - 0.5) / 255.0;

        gl_FragColor = vec4(color, 1.0);
    }
`;
