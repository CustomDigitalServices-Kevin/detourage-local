export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const fr = {
  "app.title": "Détourage local",
  "app.tagline":
    "Supprimez l'arrière-plan de vos images directement dans votre navigateur : PNG transparent en un clic.",
  "app.localBanner":
    "100% local : vos images ne quittent jamais votre appareil. Aucun envoi, aucun serveur.",

  "webgpu.title": "Navigateur non compatible",
  "webgpu.body":
    "Cet outil necessite un navigateur compatible WebGPU (Chrome ou Edge sur ordinateur, version recente). Votre navigateur ne le supporte pas encore.",
  "webgpu.detail":
    "Le modele de detourage s'execute sur le GPU via WebGPU. Sans acceleration GPU, il ne peut pas fonctionner de maniere fiable dans le navigateur.",
  "webgpu.docLink": "En savoir plus sur la compatibilite",

  "nav.home": "Accueil",
  "nav.privacy": "Confidentialité et RGPD",
  "nav.licenses": "Licences tierces",

  "dropzone.hint": "Déposez vos images ici ou cliquez pour parcourir",
  "dropzone.hintActive": "Déposez vos images pour les ajouter",
  "dropzone.browseLabel": "Parcourir vos images",

  "work.title": "Images sélectionnées",
  "work.empty": "Aucune image pour le moment. Ajoutez-en une ci-dessus.",
  "work.count.one": "image sélectionnée",
  "work.count.other": "images sélectionnées",
  "work.remove": "Retirer cette image",
  "work.clearAll": "Tout retirer",
  "work.rejected": "Format non pris en charge et ignoré :",

  "trust.gdpr.title": "Conforme RGPD par design",
  "trust.gdpr.body":
    "Aucune image ne transite : la politique de sécurité (CSP) du navigateur bloque techniquement tout envoi.",
  "trust.offline.title": "Hors ligne après le 1er chargement",
  "trust.offline.body":
    "Le modèle de détourage est hébergé avec l'application et mis en cache : après le premier chargement, tout fonctionne sans connexion.",
  "trust.opensource.title": "Open source (MIT)",
  "trust.opensource.body":
    "Code source public sous licence MIT. Aucun tracker, aucun cookie, aucune inscription.",

  "privacy.title": "Confidentialité et RGPD",
  "privacy.back": "Retour à l'accueil",
  "privacy.intro.title": "Vos images restent chez vous",
  "privacy.intro.body":
    "Ce détoureur fonctionne entièrement dans votre navigateur, avec WebGPU (accélération GPU) et les API web natives. Aucune image n'est jamais envoyée à un serveur, y compris le nôtre.",
  "privacy.local.title": "Traitement 100% local",
  "privacy.local.body":
    "Le modèle d'intelligence artificielle qui sépare le sujet de l'arrière-plan est hébergé avec l'application et exécuté dans votre navigateur. Vos images ne transitent jamais sur le réseau.",
  "privacy.comparison.title": "Contrairement aux détoureurs en ligne",
  "privacy.comparison.body":
    "Les outils de détourage cloud (remove.bg, Canva, Photoroom...) téléversent vos images sur des serveurs tiers. Pour une photo sensible (identité, produit confidentiel, document personnel), l'image a tout de même quitté votre appareil, transité sur des réseaux tiers, et été stockée temporairement ailleurs. Avec ce détoureur, ce risque n'existe pas : il n'y a rien à téléverser.",
  "privacy.data.title": "Aucune donnée personnelle collectée",
  "privacy.data.body":
    "Nous ne collectons aucune donnée personnelle, aucun identifiant, aucune adresse email. Il n'y a pas de compte utilisateur, pas de base de données, pas d'analytics tiers embarqué sur cette application.",
  "privacy.cookies.title": "Pas de cookies",
  "privacy.cookies.body":
    "Cette application ne dépose aucun cookie. Votre préférence de langue est conservée uniquement en mémoire le temps de la session.",

  "licenses.title": "Licences tierces",
  "licenses.back": "Retour à l'accueil",
  "licenses.intro":
    "Ce détoureur est un logiciel libre publié sous licence MIT. Il s'appuie sur les bibliothèques open source suivantes et sur un modèle sous licence MIT, exécutés entièrement dans votre navigateur.",
  "licenses.columnLibrary": "Bibliothèque",
  "licenses.columnLicense": "Licence",

  "model.prepareHint":
    "Le modèle de détourage (~40-90 Mo) se charge au premier détourage, puis reste en cache pour vos prochaines images.",
  "model.loading": "Chargement du modèle de détourage…",
  "model.ready": "Modèle prêt",
  "model.error": "Le chargement du modèle a échoué. Vérifiez votre connexion, puis réessayez.",
  "model.retry": "Réessayer",
  "model.backend.webgpu": "Accélération GPU (WebGPU)",
  "model.backend.wasm": "Mode compatibilité (WebAssembly)",

  "gallery.select": "Sélectionner cette image",
  "gallery.status.processing": "Détourage…",
  "gallery.status.ready": "Détourée",
  "gallery.status.error": "Échec",
  "gallery.processAll": "Tout détourer",
  "gallery.processing": "Détourage en cours…",

  "editor.empty": "Sélectionnez ou ajoutez une image pour la détourer.",
  "editor.process": "Détourer l'arrière-plan",
  "editor.reprocess": "Recalculer le détourage",
  "editor.processing": "Détourage en cours…",
  "editor.before": "Original",
  "editor.after": "Résultat",
  "editor.download": "Télécharger le PNG",
  "editor.downloadAll": "Tout télécharger",
  "editor.hintReady":
    "Ajustez l'arrière-plan et retouchez le masque si besoin, puis téléchargez le PNG.",
  "editor.error.decode":
    "Cette image n'a pas pu être décodée. Essayez un autre fichier (PNG, JPG, WebP ou HEIC).",
  "editor.error.generic": "Le détourage a échoué. Réessayez.",

  "bg.title": "Arrière-plan",
  "bg.transparent": "Transparent",
  "bg.color": "Couleur",
  "bg.image": "Image",
  "bg.custom": "Personnalisée",
  "bg.customLabel": "Code couleur hexadécimal",
  "bg.invalid": "Code couleur invalide (ex : #1a1a1a).",
  "bg.chooseImage": "Choisir une image de fond",
  "bg.replaceImage": "Changer l'image de fond",
  "bg.imageError": "Cette image de fond n'a pas pu être chargée.",

  "brush.title": "Retouche du masque",
  "brush.hint": "Peignez sur le résultat pour restaurer ou effacer des zones.",
  "brush.restore": "Restaurer",
  "brush.erase": "Effacer",
  "brush.size": "Taille du pinceau",
  "brush.hardness": "Dureté",
  "brush.reset": "Réinitialiser",

  "footer.brand": "Custom Digital Services",
} as const;

export type MessageKey = keyof typeof fr;

const en: Record<MessageKey, string> = {
  "app.title": "Local Background Remover",
  "app.tagline":
    "Remove the background of your images directly in your browser: a transparent PNG in one click.",
  "app.localBanner":
    "100% local: your images never leave your device. No upload, no server.",

  "webgpu.title": "Browser not supported",
  "webgpu.body":
    "This tool requires a WebGPU-capable browser (Chrome or Edge on desktop, recent version). Your browser does not support it yet.",
  "webgpu.detail":
    "The background-removal model runs on the GPU through WebGPU. Without GPU acceleration it cannot run reliably in the browser.",
  "webgpu.docLink": "Learn more about compatibility",

  "nav.home": "Home",
  "nav.privacy": "Privacy & GDPR",
  "nav.licenses": "Third-party licenses",

  "dropzone.hint": "Drop your images here or click to browse",
  "dropzone.hintActive": "Drop your images to add them",
  "dropzone.browseLabel": "Browse your images",

  "work.title": "Selected images",
  "work.empty": "No images yet. Add one above.",
  "work.count.one": "image selected",
  "work.count.other": "images selected",
  "work.remove": "Remove this image",
  "work.clearAll": "Remove all",
  "work.rejected": "Unsupported format, ignored:",

  "trust.gdpr.title": "GDPR-compliant by design",
  "trust.gdpr.body":
    "No image ever transits: the browser's security policy (CSP) technically blocks any upload.",
  "trust.offline.title": "Offline after the first load",
  "trust.offline.body":
    "The background-removal model is hosted with the app and cached: after the first load, everything works without a connection.",
  "trust.opensource.title": "Open source (MIT)",
  "trust.opensource.body":
    "Publicly available source code under the MIT license. No tracker, no cookie, no sign-up.",

  "privacy.title": "Privacy & GDPR",
  "privacy.back": "Back to home",
  "privacy.intro.title": "Your images stay with you",
  "privacy.intro.body":
    "This background remover runs entirely in your browser, using WebGPU (GPU acceleration) and native web APIs. No image is ever sent to a server, including ours.",
  "privacy.local.title": "100% local processing",
  "privacy.local.body":
    "The AI model that separates the subject from the background is hosted with the app and runs inside your browser. Your images never travel over the network.",
  "privacy.comparison.title": "Unlike online background removers",
  "privacy.comparison.body":
    "Cloud background removers (remove.bg, Canva, Photoroom...) upload your images to third-party servers. For a sensitive photo (ID, confidential product, personal document), the image still left your device, transited third-party networks, and was temporarily stored elsewhere. With this remover, that risk does not exist: there is nothing to upload.",
  "privacy.data.title": "No personal data collected",
  "privacy.data.body":
    "We collect no personal data, no identifiers, no email address. There is no user account, no database, no third-party analytics embedded in this application.",
  "privacy.cookies.title": "No cookies",
  "privacy.cookies.body":
    "This application sets no cookies. Your language preference is kept only in memory for the duration of the session.",

  "licenses.title": "Third-party licenses",
  "licenses.back": "Back to home",
  "licenses.intro":
    "This background remover is free software released under the MIT license. It relies on the following open source libraries and an MIT-licensed model, all running entirely in your browser.",
  "licenses.columnLibrary": "Library",
  "licenses.columnLicense": "License",

  "model.prepareHint":
    "The background-removal model (~40-90 MB) loads on your first cutout, then stays cached for your next images.",
  "model.loading": "Loading the background-removal model…",
  "model.ready": "Model ready",
  "model.error": "The model failed to load. Check your connection, then try again.",
  "model.retry": "Try again",
  "model.backend.webgpu": "GPU acceleration (WebGPU)",
  "model.backend.wasm": "Compatibility mode (WebAssembly)",

  "gallery.select": "Select this image",
  "gallery.status.processing": "Removing…",
  "gallery.status.ready": "Done",
  "gallery.status.error": "Failed",
  "gallery.processAll": "Remove all backgrounds",
  "gallery.processing": "Removing backgrounds…",

  "editor.empty": "Select or add an image to remove its background.",
  "editor.process": "Remove background",
  "editor.reprocess": "Recompute cutout",
  "editor.processing": "Removing background…",
  "editor.before": "Original",
  "editor.after": "Result",
  "editor.download": "Download PNG",
  "editor.downloadAll": "Download all",
  "editor.hintReady": "Adjust the background and retouch the mask if needed, then download the PNG.",
  "editor.error.decode":
    "This image could not be decoded. Try another file (PNG, JPG, WebP or HEIC).",
  "editor.error.generic": "Background removal failed. Please try again.",

  "bg.title": "Background",
  "bg.transparent": "Transparent",
  "bg.color": "Colour",
  "bg.image": "Image",
  "bg.custom": "Custom",
  "bg.customLabel": "Hex colour code",
  "bg.invalid": "Invalid colour code (e.g. #1a1a1a).",
  "bg.chooseImage": "Choose a background image",
  "bg.replaceImage": "Change background image",
  "bg.imageError": "This background image could not be loaded.",

  "brush.title": "Mask retouch",
  "brush.hint": "Paint on the result to restore or erase areas.",
  "brush.restore": "Restore",
  "brush.erase": "Erase",
  "brush.size": "Brush size",
  "brush.hardness": "Hardness",
  "brush.reset": "Reset",

  "footer.brand": "Custom Digital Services",
};

export const messages: Record<Locale, Record<MessageKey, string>> = { fr, en };

export function detectLocale(): Locale {
  const candidates = typeof navigator === "undefined" ? [] : navigator.languages;
  for (const lang of candidates) {
    if (lang.toLowerCase().startsWith("fr")) return "fr";
    if (lang.toLowerCase().startsWith("en")) return "en";
  }
  return "fr";
}
