// setup renderer

var renderer = new THREE.WebGLRenderer({
  alpha: true,
});
renderer.setClearColor(0xffffff, 0);
renderer.autoClear = false;
renderer.sortObjects = false;

document.body.appendChild(renderer.domElement);

// setup render target params

var rtp = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  stencilBuffer: false
};
var w = window.innerWidth;
var h = window.innerHeight;

// setup content that will form the trail

var time = 0;
var contentScene = new THREE.Scene();
var contentCamera = new THREE.PerspectiveCamera(60, w / h, 1, 10000);
var contentObject = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshBasicMaterial({
    color: 0xff00ff
  })
);
contentObject.position.z = -20;
contentScene.add(contentObject);

// create render target to render content into

var contentRt = new THREE.WebGLRenderTarget(w, h, rtp);

// create feedback renderer

var feedbackRenderer = new FeedbackRenderer({
  renderer,
  renderTargetParams: rtp,
  width: w,
  height: h,
  uniforms: {
    uSrcMap: {value: contentRt.texture},
    uTrailColor: {value: new THREE.Color(0x009fdf)},
    uTrailFactor: {value: 0.9}
  },
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D uFeedbackMap;
    uniform sampler2D uSrcMap;
    uniform vec3 uTrailColor;
    uniform float uTrailFactor;

    void main() {
      // sample current texel
      vec4 currentTexel = texture2D(uFeedbackMap, vUv);
      currentTexel *= uTrailFactor;
      // sample new texel
      vec4 newTexel = texture2D(uSrcMap, vUv);
      // output color based on alpha and trail color
      gl_FragColor = vec4(uTrailColor, currentTexel.a + newTexel.a);
    }
  `
});

// create comp scene with two quads

var size = 2;
var compScene = new THREE.Scene();
var compCamera = new THREE.OrthographicCamera(size * -0.5, size * 0.5, size * 0.5, size * -0.5, 0, 1);

var contentQuad = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(size, size),
  new THREE.MeshBasicMaterial({
    map: contentRt.texture,
    transparent: true,
  })
);

var trailQuad = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(size, size),
  new THREE.MeshBasicMaterial({
    transparent: true,
    map: feedbackRenderer.getTexture(),
  })
);

compScene.add(trailQuad);
compScene.add(contentQuad);

// render

function render() {
  time += 0.02;
  contentObject.position.x = Math.cos(time) * 4;
  contentObject.position.y = Math.sin(time) * 4;
  contentObject.rotation.z += 0.04;
  
  renderer.clear();
  
  // render content to render target
  renderer.render(contentScene, contentCamera, contentRt, true);
  
  // render trail
  feedbackRenderer.render();
  
  // render comp
  renderer.render(compScene, compCamera);
  
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// resize

function resize() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  
  contentCamera.aspect = w / h;
  contentCamera.updateProjectionMatrix();
  
  renderer.setSize(w, h);
  feedbackRenderer.setSize(w, h);
}

window.addEventListener('resize', resize);
resize();
