FeedbackRenderer = function(params) {
  var rtp = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false
  };
  var w = window.innerWidth;
  var h = window.innerHeight;
  
  this.rtSrc = new THREE.WebGLRenderTarget(w, h, rtp);
  this.rtDst = new THREE.WebGLRenderTarget(w, h, rtp);
  
  var size = 2;
  
  this.material = new THREE.ShaderMaterial({
    uniforms: Object.assign({}, params.uniforms, {
      uFeedbackMap: {value: this.rtSrc.texture}
    }),
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
                
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: params.fragmentShader
  });
  
  this.renderer = params.renderer;
  this.camera = new THREE.OrthographicCamera(size * -0.5, size * 0.5, size * 0.5, size * -0.5, 0, 1);
  this.scene = new THREE.Scene();
  this.quad = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(size, size),
    this.material
  );
  this.scene.add(this.quad);
  
};

FeedbackRenderer.prototype = {
  getTexture: function() {
    return this.rtDst.texture;
  },
  render: function() {
    var tmp = this.rtSrc;
    this.rtSrc = this.rtDst;
    this.rtDst = tmp;
    
    this.material.uniforms.uFeedbackMap.value = this.rtSrc.texture;
    this.renderer.render(this.scene, this.camera, this.rtDst, true);
  }
};
