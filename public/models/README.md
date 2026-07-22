# Modèles ONNX self-hostés

Ce dossier accueille les poids du modèle de détourage, servis en same-origin
pour préserver la CSP stricte (`connect-src 'self'`) et la promesse « 100%
local » : aucun fetch vers huggingface.co au runtime.

## Layout attendu (imposé par Transformers.js)

Transformers.js construit le chemin local ainsi :
`env.localModelPath` + `modelId` + sous-dossier + fichier. Avec
`env.localModelPath = "models/"` et `modelId = "onnx-community/BiRefNet_lite-ONNX"`,
le dossier DOIT donc contenir l'org `onnx-community/` :

```
public/models/
└── onnx-community/
    └── BiRefNet_lite-ONNX/     → modèle principal (MIT, onnx-community/BiRefNet_lite-ONNX)
        ├── config.json             (81 o, versionné)
        ├── preprocessor_config.json (391 o, versionné)
        └── onnx/
            └── model_fp16.onnx     (114 538 221 o ≈ 109 Mio, HORS git)
```

## Variante retenue : fp16

Le dépôt `onnx-community/BiRefNet_lite-ONNX` ne publie que deux variantes :

| Fichier              | dtype | Taille        |
|----------------------|-------|---------------|
| `onnx/model.onnx`    | fp32  | 224 005 088 o (~214 Mio) |
| `onnx/model_fp16.onnx` | fp16 | 114 538 221 o (~109 Mio) |

Il n'existe **pas** de variante quantifiée (q8 / `model_quantized.onnx`). On
retient donc `model_fp16.onnx`, la plus légère : WebGPU l'exécute nativement, et
le repli WASM la charge aussi (onnxruntime-web calcule les ops fp16 en fp32).
`src/lib/model-config.ts` (`resolveModel`) demande `dtype: "fp16"` pour BiRefNet
sur les deux backends, ce qui pointe vers ce fichier unique.

SHA-256 attendu de `model_fp16.onnx` :
`d39b897ceb16ae654c1731f3dba0cf9b368d9cae74b5a57459b455cc8bfec402`

## Récupération des poids (hors git)

Les `*.onnx` ne sont pas versionnés (volumétrie, voir `.gitignore`). Les JSON de
config, eux, restent versionnés. Pour (re)télécharger le poids dans le bon
chemin, avec vérification SHA-256 :

```bash
npm run fetch:model
# ou vers un dossier de déploiement précis :
node scripts/fetch-model.mjs <chemin/vers/public/models>
```

Source : https://huggingface.co/onnx-community/BiRefNet_lite-ONNX (MIT)

## Déploiement CDS (prod)

Le site CDS sert l'outil sous `/outils/detourage/`. Le poids doit exister à :
`cds-site/CDS/public/outils/detourage/models/onnx-community/BiRefNet_lite-ONNX/onnx/model_fp16.onnx`
Il est lui aussi hors git (voir le `.gitignore` de CDS) et doit être synchronisé
sur le VPS au déploiement (rsync/scp de l'artefact ou `fetch-model.mjs` ciblé sur
ce dossier).

## Option portrait (non fournie)

Le choix `modnet` (`Xenova/modnet`, Apache-2.0) reste câblé dans le code mais ses
poids ne sont pas déposés ici. `resolveModel` conserve pour lui le schéma
classique fp32 (WebGPU) / q8 (WASM), car ce dépôt-là publie bien une variante
quantifiée.

## Interdits de licence

Ne jamais utiliser `@imgly/background-removal` (AGPL) ni les modèles BRIA RMBG
(CC BY-NC). Voir `scripts/check-licenses.mjs`.
