// ============================================================================
// Hero-Ribbon — Three.js wavy rainbow ribbon behind Section-01.
// ES module (loaded via <script type="module">); independent of main.js.
// Skipped entirely under prefers-reduced-motion, or if Three.js/WebGL
// aren't available — the CSS gradient background still renders fine alone.
// ============================================================================

import * as THREE from "three";

var VERTEX_SHADER = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

var FRAGMENT_SHADER = `
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;

    // Cheap HSL -> RGB (no external dependency).
    vec3 hsl2rgb(vec3 hsl) {
        vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
    }

    void main() {
        vec2 uv = vUv;

        // Layered sine/cosine waves for an organic, non-repeating drift.
        float wave =
            sin(uv.x * 6.283185 * 1.1 + uTime) * 0.05 +
            sin(uv.x * 6.283185 * 2.3 - uTime * 0.6) * 0.025 +
            cos(uv.x * 6.283185 * 0.6 + uTime * 0.35) * 0.035;

        float centerY = 0.22 + wave;
        float dist = abs(uv.y - centerY);

        float thickness = 0.09;
        float band = smoothstep(thickness, 0.0, dist);

        // Slow hue cycle along the ribbon and through time.
        float hue = fract(uTime * 0.035 + uv.x * 0.6);
        vec3 spectrum = hsl2rgb(vec3(hue, 0.85, 0.58));

        // Bright white core fading into spectrum colour toward the ribbon edge.
        float core = smoothstep(thickness * 0.55, 0.0, dist);
        vec3 color = mix(spectrum, vec3(1.0), core * 0.85);

        // Fade near the screen edges so it reads as a floating ribbon.
        float edgeFade = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x);

        float alpha = band * edgeFade * 0.4;

        gl_FragColor = vec4(color, alpha);
    }
`;

var HeroRibbon = {
    Selectors: {
        canvas: ".Section-01-canvas"
    },
    Refs: {},
    State: {
        running: false,
        inView: true
    },

    init: function () {
        this.Refs.canvas = document.querySelector(this.Selectors.canvas);
        if (!this.Refs.canvas || !window.WebGLRenderingContext) {
            return;
        }

        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            return;
        }

        this.setup();
        this.bindEvents();
        this.start();
    },

    setup: function () {
        var canvas = this.Refs.canvas;
        var size = this.getSize();

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, size.width / size.height, 0.1, 100);
        this.camera.position.z = 6;

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(size.width, size.height, false);

        this.uniforms = {
            uTime: { value: 0 }
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            transparent: true,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
        this.scene.add(this.mesh);

        this.fitPlaneToView(size.width, size.height);
        this.boundTick = this.tick.bind(this);
    },

    getSize: function () {
        var parent = this.Refs.canvas.parentElement;
        return { width: parent.clientWidth, height: parent.clientHeight };
    },

    fitPlaneToView: function (width, height) {
        var distance = this.camera.position.z;
        var vFov = (this.camera.fov * Math.PI) / 180;
        var planeHeight = 2 * Math.tan(vFov / 2) * distance;
        var planeWidth = planeHeight * (width / height);
        this.mesh.scale.set(planeWidth, planeHeight, 1);
    },

    bindEvents: function () {
        var self = this;

        window.addEventListener("resize", function () {
            self.onResize();
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                self.stop();
            } else if (self.State.inView) {
                self.start();
            }
        });

        if ("IntersectionObserver" in window) {
            this.observer = new IntersectionObserver(function (entries) {
                self.State.inView = entries[0].isIntersecting;
                if (self.State.inView && !document.hidden) {
                    self.start();
                } else {
                    self.stop();
                }
            }, { threshold: 0.01 });
            this.observer.observe(this.Refs.canvas);
        }
    },

    onResize: function () {
        var size = this.getSize();
        this.camera.aspect = size.width / size.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(size.width, size.height, false);
        this.fitPlaneToView(size.width, size.height);
    },

    start: function () {
        if (this.State.running) {
            return;
        }
        this.State.running = true;
        this.boundTick();
    },

    stop: function () {
        this.State.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    },

    tick: function () {
        if (!this.State.running) {
            return;
        }
        var delta = this.clock.getDelta();
        this.uniforms.uTime.value += delta * 0.2;
        this.renderer.render(this.scene, this.camera);
        this.rafId = requestAnimationFrame(this.boundTick);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    HeroRibbon.init();
});
