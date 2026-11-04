import dash from "./dash.fr";

const fr = {
  meta: {
    siteTitle: "Voom, location de voiture au Maroc",
    siteDescription: "Louez une voiture auprès d'agences vérifiées dans les villes du Maroc. Choisissez, réservez en quelques minutes et payez sur place, en dirhams.",
  },
  nav: { cities: "Villes", agencies: "Agences", download: "Télécharger l'app", language: "Langue", menu: "Menu" },
  hero: {
    eyebrow: "Location de voiture au Maroc",
    title: "Louez la voiture qu'il vous faut, en quelques minutes.",
    subtitle: "Des agences vérifiées, des prix clairs en dirhams, et le paiement sur place. Choisissez votre ville pour voir les voitures disponibles.",
    cityLabel: "Votre ville",
    search: "Voir les voitures",
    chips: ["Agences vérifiées", "Paiement sur place", "Prix en dirhams"],
  },
  cities: { title: "Louer une voiture dans votre ville", subtitle: "Les principales villes du Maroc, avec des agences vérifiées.", see: "Voir les voitures" },
  how: {
    title: "Comment ça marche",
    steps: [
      { title: "Choisissez une voiture", text: "Parcourez les voitures de votre ville, avec photos, équipements et prix par jour." },
      { title: "Envoyez votre demande", text: "Choisissez vos dates dans l'application Voom. L'agence reçoit votre demande tout de suite." },
      { title: "Récupérez-la et payez sur place", text: "Une fois la réservation confirmée, vous récupérez la voiture et vous payez à l'agence, en dirhams." },
    ],
  },
  why: {
    title: "Pourquoi Voom",
    items: [
      { title: "Agences vérifiées", text: "Chaque agence est examinée à la main avant que ses voitures n'apparaissent." },
      { title: "Paiement sur place", text: "Pas de paiement en ligne. Vous payez à l'agence, en dirhams, quand vous prenez la voiture." },
      { title: "Locataires vérifiés", text: "Les pièces d'identité des locataires sont contrôlées, pour la tranquillité de tous." },
      { title: "Simple et rapide", text: "Réservez depuis votre téléphone en quelques minutes, sans paperasse." },
    ],
  },
  popular: { title: "Voitures disponibles", subtitle: "Les dernières voitures ajoutées par nos agences.", all: "Toutes les villes" },
  agencyCta: {
    title: "Vous avez une agence de location ?",
    text: "Ajoutez votre flotte sur Voom, recevez des demandes de réservation et gérez tout depuis votre téléphone ou votre ordinateur.",
    button: "Découvrir pour les agences",
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      { q: "Comment louer une voiture avec Voom ?", a: "Choisissez une voiture dans votre ville, envoyez une demande de réservation avec vos dates depuis l'application, puis attendez la confirmation de l'agence. Vous récupérez ensuite la voiture à l'agence." },
      { q: "Dois-je payer en ligne ?", a: "Non. Le paiement se fait sur place, à l'agence, en dirhams marocains, au moment de la prise en charge." },
      { q: "Quels documents faut-il fournir ?", a: "Votre carte d'identité et votre permis de conduire, recto et verso. Ils sont vérifiés avant votre première réservation." },
      { q: "Les agences sont-elles fiables ?", a: "Oui. Chaque agence est examinée avant d'apparaître sur Voom, et son numéro d'immatriculation est contrôlé." },
      { q: "Puis-je annuler une réservation ?", a: "Oui, depuis l'application. Les annulations tardives après confirmation peuvent entraîner des restrictions sur votre compte." },
    ],
  },
  download: {
    title: "Réservez avec l'application Voom",
    text: "Les réservations se font dans l'application. Elle sera bientôt disponible sur l'App Store et Google Play.",
    soon: "Bientôt disponible",
    appStore: "App Store",
    playStore: "Google Play",
  },
  city: {
    h1: "Location de voiture à {city}",
    intro: "Trouvez une voiture à louer à {city} auprès d'agences vérifiées : économiques, berlines, SUV et plus. Les prix sont par jour, en dirhams, et le paiement se fait sur place.",
    countOne: "{count} voiture disponible",
    countMany: "{count} voitures disponibles",
    noneTitle: "Aucune voiture disponible pour le moment",
    noneText: "Les agences de {city} rejoignent Voom. Revenez bientôt ou consultez une autre ville.",
    otherCities: "Autres villes",
    faqTitle: "Louer une voiture à {city}",
    faq: [
      { q: "Quel est le prix d'une location à {city} ?", a: "Le prix dépend du modèle et de l'agence. Chaque annonce affiche le prix par jour en dirhams." },
      { q: "Faut-il un permis de conduire ?", a: "Oui, un permis de conduire valide et une pièce d'identité sont demandés avant la première réservation." },
    ],
  },
  car: {
    perDay: "/ jour",
    from: "À partir de",
    book: "Réserver dans l'application",
    bookText: "Choisissez vos dates et envoyez votre demande dans l'application Voom. Le paiement se fait sur place.",
    year: "Année",
    seats: "Places",
    fuel: "Carburant",
    transmission: "Boîte",
    category: "Catégorie",
    features: "Équipements",
    location: "Ville",
    rating: "{rating} sur 5 ({count} avis)",
    noPhoto: "Photo bientôt disponible",
    back: "Retour à {city}",
    howTitle: "Comment réserver cette voiture",
  },
  agencies: {
    h1: "Louez vos voitures avec Voom",
    intro: "Voom met votre agence devant des locataires de toutes les villes du Maroc. Ajoutez vos voitures, recevez des demandes et gérez vos réservations depuis votre téléphone ou votre ordinateur.",
    benefitsTitle: "Ce que vous obtenez",
    benefits: [
      { title: "Plus de réservations", text: "Vos voitures sont visibles par les locataires qui cherchent dans votre ville." },
      { title: "Gestion simple", text: "Acceptez ou refusez les demandes, suivez les prises en charge et vos revenus." },
      { title: "Locataires vérifiés", text: "Les pièces d'identité des locataires sont contrôlées avant leur première réservation." },
      { title: "Sur téléphone ou ordinateur", text: "Travaillez où vous voulez, avec le même compte." },
    ],
    stepsTitle: "Pour commencer",
    steps: [
      { title: "Créez votre compte agence", text: "Dans l'application, avec votre numéro d'immatriculation (RC ou ICE) et une photo de votre licence." },
      { title: "Nous vérifions votre agence", text: "Votre dossier est examiné, en général en moins de 24 heures." },
      { title: "Publiez vos voitures", text: "Ajoutez les photos, le prix par jour et les équipements. Vos voitures apparaissent dès l'approbation." },
    ],
    cta: "Créer mon compte agence",
  },
  labels: {
    category: { economy: "Économique", comfort: "Confort", luxury: "Luxe", suv: "SUV", van: "Van" },
    transmission: { manual: "Manuelle", automatic: "Automatique" },
    fuel: { petrol: "Essence", diesel: "Diesel", electric: "Électrique", hybrid: "Hybride" },
    options: {
      "GPS": "GPS", "USB charger": "Chargeur USB", "Bluetooth": "Bluetooth", "360° camera": "Caméra 360°",
      "Apple CarPlay / Android Auto": "Apple CarPlay / Android Auto", "Air conditioning": "Climatisation",
      "Parking sensors": "Capteurs de stationnement", "Reversing camera": "Caméra de recul", "Dashcam": "Caméra embarquée",
      "Child seat": "Siège enfant", "Sunroof": "Toit ouvrant", "Cruise control": "Régulateur de vitesse",
      "Unlimited mileage": "Kilométrage illimité", "Wi-Fi hotspot": "Point d'accès Wi-Fi", "Roof rack": "Barres de toit",
    } as Record<string, string>,
  },
  footer: {
    tagline: "Réservez. Roulez. Partez.",
    explore: "Explorer",
    contact: "Contact",
    rights: "Tous droits réservés.",
  },
  mock: {"explore": "Trouvez votre voiture", "car1": "Dacia Logan", "car2": "Peugeot 208", "car3": "Toyota C-HR", "perDay": "/ jour", "request": "Envoyer la demande", "dates": "12 – 15 nov.", "days": "3 jours", "total": "Total", "sent": "Demande envoyée", "confirmed": "Réservation confirmée", "verified": "Agence vérifiée", "payOnSite": "Paiement sur place", "pickup": "Prise en charge demain, 10:00", "chipConfirmed": "Confirmée", "scrollHint": "Défilez"},
  dash,
  notFound: { title: "Page introuvable", text: "Cette page n'existe pas ou a été déplacée.", home: "Retour à l'accueil" },
};

export default fr;
export type Dictionary = typeof fr;
