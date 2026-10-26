import * as THREE from './vendor/three.module.js';

// The same simulation drives both views; only rendering and pointer projection differ.
export function createThreeView(canvas, decor) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 30);
  camera.position.set(0, -3, 5);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffe8bc, 0x263b29, 2));
  const light = new THREE.DirectionalLight(0xffecd1, 4);
  light.position.set(-3, 2, 5);
  scene.add(light);
  const warm = new THREE.PointLight(0xff7431, 9, 10);
  warm.position.set(2, -1, 3);
  scene.add(warm);
  const metal = new THREE.MeshStandardMaterial({ color: 0x72796c, metalness: .72, roughness: .27 });
  const black = new THREE.MeshStandardMaterial({ color: 0x171d18, metalness: .35, roughness: .35 });
  function mesh(geometry, material, x=0, y=0, z=0) {
    const obj = new THREE.Mesh(geometry, material);
    obj.position.set(x,y,z); scene.add(obj); return obj;
  }
  const body = mesh(new THREE.CylinderGeometry(1.04,.86,.38,96,1,true), black,0,0,-.2);
  body.rotation.x = Math.PI/2;
  mesh(new THREE.TorusGeometry(1.025,.045,16,100), metal,0,0,.015);
  mesh(new THREE.TorusGeometry(.94,.025,12,100), metal,0,0,-.36);
  for (const side of [-1,1]) {
    const handle = mesh(new THREE.TorusGeometry(.18,.035,12,40),metal,side*1.12,0,-.08);
    handle.scale.y=1.5;
  }
  const oilData = Array.from({length:70},()=>new THREE.Vector3(0,0,0));
  const uniforms = { uDrops:{value:oilData}, uTime:{value:0} };
  const soupMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 p;
      void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
      varying vec2 p; uniform vec3 uDrops[70]; uniform float uTime;
      void main(){
        float dist=length(p); if(dist>.975)discard;
        float field=0.; vec2 gradient=vec2(0.);
        for(int i=0;i<70;i++){
          float radius=uDrops[i].z;
          if(radius>0.){
            vec2 delta=p-uDrops[i].xy;
            float rr=radius*radius;
            float v=exp(-2.*dot(delta,delta)/rr);
            field+=v; gradient+=(-4./rr)*delta*v;
          }
        }
        float edge=smoothstep(.11,.16,field);
        float waves=sin(p.x*28.+uTime*1.5)*sin(p.y*24.-uTime)*.018;
        vec3 normal=normalize(vec3(-gradient*.13,1.));
        vec3 lamp=normalize(vec3(-.5,.7,1.));
        float shine=pow(max(dot(normal,normalize(lamp+vec3(0.,0.,1.))),0.),45.);
        vec3 broth=mix(vec3(.27,.115,.025),vec3(.76,.43,.12),1.-pow(dist,3.));
        broth+=waves;
        vec3 oil=vec3(.59,.045,.008)*( .7+.4*max(dot(normal,lamp),0.));
        oil+=vec3(1.,.64,.25)*shine*.8;
        oil+=vec3(.28,.08,.003)*(1.-smoothstep(.13,.28,field));
        vec3 color=mix(broth,oil,edge);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  mesh(new THREE.PlaneGeometry(2,2),soupMaterial,0,0,.025);
  const green=new THREE.MeshStandardMaterial({color:0x718b35,roughness:.65});
  const chili=new THREE.MeshStandardMaterial({color:0x8c2110,roughness:.36});
  const seedMaterial=new THREE.MeshStandardMaterial({color:0xeacb81,roughness:.5});
  for (const a of decor) {
    const x=Math.cos(a.a)*a.d,y=-Math.sin(a.a)*a.d;
    let item;
    if(a.s<.25){item=mesh(new THREE.BoxGeometry(.04,.10,.018),green,x,y,.037)}
    else if(a.s<.55){item=mesh(new THREE.CapsuleGeometry(.013,.075,4,8),chili,x,y,.04);item.scale.z=.6}
    else {item=mesh(new THREE.SphereGeometry(.007,6,4),seedMaterial,x,y,.035)}
    item.rotation.z=a.a;
  }
  const chopstickMaterial=new THREE.MeshStandardMaterial({color:0x262a21,roughness:.3,metalness:.15});
  const bandMaterial=new THREE.MeshStandardMaterial({color:0xc4a266,metalness:.6,roughness:.3});
  for(let i=0;i<2;i++){
    const stick=new THREE.Group();
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.018,.009,1.9,10),chopstickMaterial);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(.019,.019,.025,10),bandMaterial);
    band.position.y=.65;stick.add(shaft,band);stick.position.set(.73+i*.09,.6,.11);
    stick.rotation.z=-.45;stick.rotation.x=.06;scene.add(stick);
  }
  const steamMaterial=new THREE.MeshBasicMaterial({color:0xe9dfc9,transparent:true,opacity:.06,depthWrite:false});
  const steam=Array.from({length:12},(_,i)=>{
    const puff=mesh(new THREE.SphereGeometry(.09,8,6),steamMaterial.clone());
    puff.userData={phase:i/12,x:Math.sin(i*7)*.7,y:Math.cos(i*4)*.7};return puff;
  });
  const raycaster=new THREE.Raycaster(), plane=new THREE.Plane(new THREE.Vector3(0,0,1),-.025);
  const hit=new THREE.Vector3();
  return {
    resize(w,h,cx,cy,r){
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(w,h,false);
      camera.left=-cx/r;camera.right=(w-cx)/r;camera.top=cy/r;camera.bottom=-(h-cy)/r;
      camera.updateProjectionMatrix();
    },
    position(e){
      const rect=canvas.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
      if(!raycaster.ray.intersectPlane(plane,hit))return null;
      return {x:hit.x,y:-hit.y,t:performance.now()};
    },
    draw(drops,t){
      for(let i=0;i<70;i++){const d=drops[i];oilData[i].set(d?d.x:0,d?-d.y:0,d ? .043*Math.sqrt(d.m) : 0)}
      uniforms.uTime.value=t;
      for(const puff of steam){const p=(t*.14+puff.userData.phase)%1;puff.position.set(puff.userData.x+Math.sin(t+p)*.04,puff.userData.y,p*.85+.1);puff.scale.setScalar(.4+p);puff.material.opacity=Math.sin(p*Math.PI)*.045}
      renderer.render(scene,camera);
    }
  };
}

