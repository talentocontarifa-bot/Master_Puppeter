# 🎭 Master Puppeter

> **AI 3D Motion Retargeting Engine for Character Creator (CC_Base) Skeletons in Remotion & Three.js**

Master Puppeter es una arquitectura y conjunto de herramientas diseñadas para traducir, interpretar y acoplar animaciones de movimiento 3D generadas por modelos de Inteligencia Artificial (estándar **SMPL**) hacia modelos y avatares 3D personalizados basados en esqueletos **Reallusion CC_Base** (como Rattle, Rufino, SuperChrist, etc.).

---

## 🛠️ Stack Tecnológico

- **AI Text-to-Motion**: `Tencent/HY-Motion-1.0` (HuggingFace Inference / Gradio Client).
- **Core 3D Engine**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber).
- **Video Rendering Pipeline**: [Remotion](https://www.remotion.dev/).
- **Formatos de Archivo**: `FBX` (Animaciones exportadas por la IA) & `GLTF/GLB` (Avatares 3D de personajes).

---

## 🧠 ¿Cómo Funciona la IA y Cómo se Interpreta?

### 1. El Modelo de IA (`Tencent/HY-Motion-1.0`)
La IA utiliza un pipeline de **Diffusion / Transformer para Text-to-3D-Motion**:
- Recibe prompts en texto (ej. *"A person dancing bachata"* o *"A person running forward and kicking a soccer ball"*).
- Genera un esqueleto de 24 joints basado en la convención matemática **SMPL** (Skinned Multi-Person Linear Model).
- Exporta la animación en un archivo `.fbx` binario con una Rest Pose de identidad casi pura ($Y$-up, $T$-Pose estándar).

### 2. El Desafío Cross-Rig
Los avatares personalizados creados en Character Creator (CC_Base) no usan la convención SMPL:
- **SMPL**: Rest Pose neutra / identidad.
- **CC_Base**: 71+ huesos con rotaciones rest intrínsecas complejas (ej. Cadera ~86° en $X$, Muslos ~163° en $Z$).

Aplicar quaternions directos de la IA colapsa el modelo 3D o pliega sus extremidades hacia el interior del torso.

---

## 📐 El Modelo Matemático de Retargeting

Para resolver la incompatibilidad entre rigs sin requerir software externo (como Blender o iClone), implementamos **Relative Delta Retargeting** directo en runtime:

$$\Delta_q = (q_{\text{rest, src}})^{-1} \cdot q_{\text{anim}}$$

$$q_{\text{final}} = q_{\text{rest, tgt}} \cdot \Delta_q$$

### 📌 Las 3 Reglas de Oro del Retargeting

1. **Deltas Relativos Puros (Sin Handicaps Manuales)**: Se extrae únicamente la rotación *relativa* a la pose de descanso de la IA y se aplica sobre la pose de descanso del objetivo.
2. **Position Tracks únicamente en el Root**: Solo la cadera principal (`CC_Base_Hip`) recibe tracks de posición espacial ($(X,Y,Z)$). Las extremidades solo reciben rotación pura (quaternions) para evitar que colapsen el esqueleto.
3. **Conjugación Pura para Ejes Invertidos (Brazos)**: Dado que la cadena del brazo en SMPL y CC_Base difiere en su eje local de swing, se aplica conjugación de quaternions ($\Delta_q^* = (-x, -y, -z, w)$) a los huesos del brazo (`Clavicle`, `Upperarm`, `Forearm`, `Hand`). Esto invierte la dirección de balanceo (evitando que los brazos vayan a la espalda) **sin generar efecto espejo Izquierda/Derecha**.

---

## 🗺️ Tabla de Mapeo SMPL → CC_Base

| SMPL (IA Target) | CC_Base (Avatar) | Transformación Aplicada |
| :--- | :--- | :--- |
| `Pelvis` / `Hips` | `CC_Base_Hip` | Root Delta + Position Track |
| `Spine1` | `CC_Base_Spine01` | Delta Relativo Puro |
| `Spine2` / `Spine3` | `CC_Base_Spine02` | Delta Relativo Puro |
| `Neck` | `CC_Base_NeckTwist01` | Delta Relativo Puro |
| `Head` | `CC_Base_Head` | Delta Relativo Puro |
| `L_Shoulder` / `R_Shoulder` | `CC_Base_L_Upperarm` / `CC_Base_R_Upperarm` | Delta Relativo + `conjugate()` |
| `L_Elbow` / `R_Elbow` | `CC_Base_L_Forearm` / `CC_Base_R_Forearm` | Delta Relativo + `conjugate()` |
| `L_Wrist` / `R_Wrist` | `CC_Base_L_Hand` / `CC_Base_R_Hand` | Delta Relativo + `conjugate()` |
| `L_Hip` / `R_Hip` | `CC_Base_L_Thigh` / `CC_Base_R_Thigh` | Delta Relativo Puro |
| `L_Knee` / `R_Knee` | `CC_Base_L_Calf` / `CC_Base_R_Calf` | Delta Relativo Puro |
| `L_Ankle` / `R_Ankle` | `CC_Base_L_Foot` / `CC_Base_R_Foot` | Delta Relativo Puro |

---

## 🚀 Uso Rápido en Código

### Retargeting Utility (`src/utils/retargeting.ts`)

```typescript
import * as THREE from 'three';
import { buildRetargetedClip } from './utils/retargeting';

// fbx: THREE.Group cargado con FBXLoader (IA Motion)
// gltfScene: THREE.Group cargado con GLTFLoader (Personaje CC_Base)
const retargetedClip = buildRetargetedClip(
  fbx,
  gltfScene,
  fbx.animations[0],
  'MasterPuppeterMotion'
);

const mixer = new THREE.AnimationMixer(gltfScene);
const action = mixer.clipAction(retargetedClip);
action.play();
```

---

## 📄 Licencia

MIT License - Desarrollado y documentado para la comunidad de animación 3D e IA.
