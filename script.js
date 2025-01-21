// Configuração inicial da cena, câmera e renderizador
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();

textureLoader.load('textures/stars/stars/textures/stars_milky_way_2048.jpg', function(texture) {
  scene.background = texture;
});

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Iluminação da cena
const light = new THREE.PointLight(0xFFFFFF, 2, 500);
light.position.set(0, 0, 0);
scene.add(light);

// Criação do Sol
const sunMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load('textures/stars/sun/textures/sun.jpg'),
});

const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
sunMaterial.map.colorSpace = THREE.SRGBColorSpace;
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);


// Criação dos Planetas e seus dados
const planets = [];
const planetData = [
  { name: "Mercúrio", radius: 1, distance: 7, texture: 'textures/planets/mercury/textures/mercury_2048.jpg' },
  { name: "Vênus", radius: 2, distance: 9, texture: 'textures/planets/venus/textures/venus_2048.jpg' },
  { name: "Terra", radius: 2.5, distance: 12, texture: 'textures/planets/earth/textures/earth_atmos_2048.jpg', moons: [{ radius: 0.5, distance: 2, color: 0xD5D8DC, speed: 0.05 }] },
  { name: "Marte", radius: 2, distance: 18, texture: 'textures/planets/mars/textures/mars_2048.jpg' },
  { name: "Júpiter", radius: 5, distance: 30, texture: 'textures/planets/jupyter/textures/jupiter_2048.jpg', moons: [{ radius: 1, distance: 4, color: 0x9B59B6, speed: 0.02 }, { radius: 1.2, distance: 7, color: 0xE74C3C, speed: 0.03 }] },
  { name: "Saturno", radius: 4, distance: 40, texture: 'textures/planets/saturn/textures/saturn_2048.jpg', hasRings: true, moons: [{ radius: 1.5, distance: 6, color: 0x8E44AD, speed: 0.01 }, { radius: 1, distance: 10, color: 0xF39C12, speed: 0.02 }] },
  { name: "Urano", radius: 3, distance: 50, texture: 'textures/planets/uranus/textures/uranus_2048.jpg', moons: [{ radius: 1, distance: 5, color: 0x2980B9, speed: 0.03 }] },
  { name: "Netuno", radius: 2.5, distance: 60, texture: 'textures/planets/neptune/textures/neptune_2048.jpg', moons: [{ radius: 1, distance: 6, color: 0x9B59B6, speed: 0.04 }] }
];

// Função para criar texto como sprite
function createTextSprite(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontSize = 48;

  // Configuração do texto
  context.font = `${fontSize}px Arial`;
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(text, canvas.width / 2, fontSize);

  // Textura do texto
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(5, 2.5, 1);
  return sprite;
}

// Função para criar apenas linhas representando as órbitas
function createOrbitLine(radius) {
  const segments = 100;
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitVertices = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    orbitVertices.push(radius * Math.cos(theta), 0, radius * Math.sin(theta));
  }
  orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitVertices, 3));
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  return new THREE.LineLoop(orbitGeometry, orbitMaterial);
}

// Função para criar os anéis de Saturno com mapeamento correto
function createSaturnRings(radius) {
  const ringGeometry = new THREE.RingGeometry(radius + 1, radius + 3, 100, 1); // Anel com espessura
  const texture = textureLoader.load('textures/planets/saturn/textures/saturn_rings_2048.jpg');

  const uv = ringGeometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const x = uv.getX(i) * 2.0 - 1.0;
    const y = uv.getY(i) * 2.0 - 1.0;
    const theta = Math.atan2(y, x); // Ângulo polar
    const r = Math.sqrt(x * x + y * y); // Distância ao centro
    uv.setXY(i, (theta / (2 * Math.PI) + 0.5), r);
  }

  ringGeometry.attributes.uv.needsUpdate = true;

  const ringMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    opacity: 0.8,
    transparent: true,
    emissive: new THREE.Color(0xF1C40F), // Brilho suave nos anéis
    emissiveIntensity: 0.3,  // Intensidade do brilho
  });  

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2; // Alinhar com o plano correto

  return ring;
}

// Função para criar uma lua
function createMoon(radius, distance, color) {
  const moonMaterial = new THREE.MeshPhongMaterial( {
    map: textureLoader.load( 'textures/planets/earth/satelites/moon/textures/moon_1024.jpg' )
  } );
  moonMaterial.map.colorSpace = THREE.SRGBColorSpace;


  const moonGeometry = new THREE.SphereGeometry(radius, 16, 16);
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.x = distance;
  return moon;
}

// Adiciona os planetas, suas luas e nomes à cena
planetData.forEach(data => {
  // Criação do planeta
  const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    map: textureLoader.load(data.texture),
    shininess: 30,
    specular: new THREE.Color(0x888888),
  });
  
  const planet = new THREE.Mesh(geometry, material);
  planet.position.x = data.distance;

  // Criação do texto acima do planeta
  const textSprite = createTextSprite(data.name);
  textSprite.position.set(data.distance, data.radius + 5, 0); // Posição acima do planeta

  // Criação da linha de órbita
  const orbitLine = createOrbitLine(data.distance);
  scene.add(orbitLine); // Adiciona a linha de órbita à cena

  // Criação dos anéis de Saturno
  if (data.name === "Saturno") {
    const rings = createSaturnRings(data.radius);
    planet.add(rings); // Adiciona os anéis ao planeta
  }

  scene.add(planet);
  scene.add(textSprite);

  // Adiciona as luas do planeta (se houver)
  if (data.moons) {
    data.moons.forEach(moonData => {
      const moon = createMoon(moonData.radius, moonData.distance, moonData.color);
      planet.add(moon);
      moon.orbitAngle = Math.random() * Math.PI * 2; // Posição inicial da órbita da lua
      moon.speed = moonData.speed; // Atribui a velocidade da lua

    });
  }

  // Adiciona o planeta à lista
  planets.push({
    mesh: planet, 
    distance: data.distance, 
    speed: Math.random() * 0.006 + 0.01, // Velocidade inicial de translação do planeta
    label: textSprite, 
    orbit: orbitLine,
    orbitAngle: Math.random() * Math.PI * 2 // Posição inicial da órbita do planeta
  });
});

// Variável para controlar a visibilidade das órbitas
let areOrbitsVisible = true;

// Configuração inicial da posição da câmera
camera.position.z = 100;
camera.position.y = 10;

// Variáveis de controle
let isTopView = false;

// Variáveis de controle da rotação das luas
let moonRotationSpeed = 0.01;

// Função de animação para movimentação dos planetas e suas luas
function animate() {
  requestAnimationFrame(animate);

  // Movimentação orbital dos planetas (translação)
  planets.forEach((planet, index) => {
    planet.orbitAngle += planet.speed; // Atualiza o ângulo da órbita com base na velocidade de translação

    // Calcula a posição dos planetas com base no ângulo de órbita
    planet.mesh.position.x = planet.distance * Math.cos(planet.orbitAngle);
    planet.mesh.position.z = planet.distance * Math.sin(planet.orbitAngle);

    // Atualiza a posição do texto junto com o planeta
    planet.label.position.x = planet.mesh.position.x;
    planet.label.position.z = planet.mesh.position.z;

    // Atualiza a visibilidade das órbitas com base na variável areOrbitsVisible
    planet.orbit.visible = areOrbitsVisible;

    // Movimentação das luas
    if (planet.moons) {
      planet.moons.forEach((moon, moonIndex) => {
        moon.orbitAngle += moon.speed; // Atualiza o ângulo da órbita com base na velocidade da lua

        // Calcula a posição das luas em torno do planeta
        moon.position.x = planet.mesh.position.x + moon.distance * Math.cos(moon.orbitAngle);
        moon.position.z = planet.mesh.position.z + moon.distance * Math.sin(moon.orbitAngle);

        // As luas também podem girar em torno de si mesmas (rotação própria)
        moon.rotation.y += moonRotationSpeed; // Rotação da lua em torno de seu próprio eixo
      });
    }
  });

  renderer.render(scene, camera);
  updateSpeedDisplay(); // Atualiza a exibição da velocidade de translação
}

// Cria um painel de HUD
const hud = document.createElement('div');
hud.style.position = 'absolute';
hud.style.top = '10px';
hud.style.left = '10px';
hud.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; 
hud.style.color = '#FFFFFF';
hud.style.padding = '15px';
hud.style.borderRadius = '10px';  
hud.style.fontFamily = 'Arial, sans-serif';
hud.style.fontSize = '16px';  
hud.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';  
document.body.appendChild(hud);

// Define o conteúdo da HUD
hud.innerHTML = `
  <strong>Controles:</strong><br>
  ↑ / ↓ - Mover câmera para cima/baixo<br>
  T - Alternar visão (Topo/Padrão)<br>
  G - Alternar visibilidade das órbitas<br>
  A - Aumentar velocidade dos planetas<br>
  D - Diminuir velocidade dos planetas<br>
  0 - Diminuir rotação das luas<br>
  1 - Aumentar rotação das luas
`;

// Exibe a velocidade de translação no canto inferior da tela
const speedDisplay = document.createElement('div');
speedDisplay.style.position = 'absolute';
speedDisplay.style.bottom = '10px';
speedDisplay.style.left = '10px';
speedDisplay.style.color = 'white';
speedDisplay.style.fontSize = '20px';
speedDisplay.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(speedDisplay);

// Atualiza o texto da velocidade
function updateSpeedDisplay() {
  const avgSpeed = planets.reduce((acc, planet) => acc + planet.speed, 0) / planets.length;
  speedDisplay.textContent = `Velocidade de translação média: ${avgSpeed.toFixed(4)} unidades/seg`;
}

// Movimento da câmera com as setas do teclado
document.addEventListener('keydown', event => {
  const cameraSpeed = 2; // Velocidade de movimento da câmera

  switch (event.key) {
    case 'ArrowUp': // Move a câmera para cima
      camera.position.y += cameraSpeed;
      break;
    case 'ArrowDown': // Move a câmera para baixo
      camera.position.y -= cameraSpeed;
      break;
    case 't': // Alterna a posição da câmera (visão de cima ou padrão)
      if (isTopView) {
        camera.position.set(0, 10, 100);
        camera.lookAt(sun.position);
      } else {
        camera.position.set(0, 100, 0);
        camera.lookAt(sun.position);
      }
      isTopView = !isTopView;
      break;
    case 'g': // Alterna a visibilidade das órbitas
      areOrbitsVisible = !areOrbitsVisible;
      break;
    case 'a': // Aumenta a velocidade de translação dos planetas
      planets.forEach(planet => {
        planet.speed += 0.0005;
        if (planet.moons) {
          planet.moons.forEach(moon => {
            moon.speed += 0.0002; // Aumenta a velocidade das luas proporcionalmente
          });
        }
      });
      break;
    case 'd': // Diminui a velocidade de translação dos planetas
      planets.forEach(planet => {
        planet.speed = Math.max(0.0002, planet.speed - 0.0005);
        if (planet.moons) {
          planet.moons.forEach(moon => {
            moon.speed = Math.max(0.0002, moon.speed - 0.0001);
          });
        }
      });
      break;
    case '0': // Diminui a velocidade de rotação das luas
      moonRotationSpeed = Math.max(0.005, moonRotationSpeed - 0.005);
      break;
    case '1': // Aumenta a velocidade de rotação das luas
      moonRotationSpeed += 0.005;
      break;
  }
});

animate();
