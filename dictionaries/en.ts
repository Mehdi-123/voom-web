import type { Dictionary } from "./fr";
import dash from "./dash.en";

const en: Dictionary = {
  meta: {
    siteTitle: "Voom, car rental in Morocco",
    siteDescription: "Rent a car from verified agencies in cities across Morocco. Pick a car, book in minutes and pay on site, in dirhams.",
  },
  nav: { cities: "Cities", agencies: "Agencies", download: "Get the app", language: "Language", menu: "Menu" },
  hero: {
    eyebrow: "Car rental in Morocco",
    title: "Rent the car you need, in minutes.",
    subtitle: "Verified agencies, clear prices in dirhams, and payment on site. Choose your city to see the cars available.",
    cityLabel: "Your city",
    search: "See cars",
    chips: ["Verified agencies", "Pay on site", "Prices in dirhams"],
  },
  cities: { title: "Rent a car in your city", subtitle: "Morocco's main cities, with verified agencies.", see: "See cars" },
  how: {
    title: "How it works",
    steps: [
      { title: "Pick a car", text: "Browse the cars in your city, with photos, features and the price per day." },
      { title: "Send your request", text: "Choose your dates in the Voom app. The agency gets your request right away." },
      { title: "Pick it up and pay on site", text: "Once the booking is confirmed, you collect the car and pay the agency, in dirhams." },
    ],
  },
  why: {
    title: "Why Voom",
    items: [
      { title: "Verified agencies", text: "Every agency is reviewed by hand before its cars appear." },
      { title: "Pay on site", text: "No online payment. You pay the agency, in dirhams, when you take the car." },
      { title: "Verified renters", text: "Renters' ID documents are checked, for everyone's peace of mind." },
      { title: "Simple and fast", text: "Book from your phone in a few minutes, with no paperwork." },
    ],
  },
  popular: { title: "Cars available now", subtitle: "The latest cars added by our agencies.", all: "All cities" },
  agencyCta: {
    title: "Do you run a car rental agency?",
    text: "Put your fleet on Voom, receive booking requests and manage everything from your phone or your computer.",
    button: "Discover Voom for agencies",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      { q: "How do I rent a car with Voom?", a: "Choose a car in your city, send a booking request with your dates from the app, then wait for the agency to confirm. You then collect the car at the agency." },
      { q: "Do I pay online?", a: "No. You pay on site, at the agency, in Moroccan dirhams, when you pick the car up." },
      { q: "What documents do I need?", a: "Your ID card and your driving licence, front and back. They are checked before your first booking." },
      { q: "Can I trust the agencies?", a: "Yes. Every agency is reviewed before it appears on Voom, and its registration number is checked." },
      { q: "Can I cancel a booking?", a: "Yes, from the app. Late cancellations after confirmation can lead to restrictions on your account." },
    ],
  },
  download: {
    title: "Book with the Voom app",
    text: "Bookings are made in the app. It is coming soon to the App Store and Google Play.",
    soon: "Coming soon",
    appStore: "App Store",
    playStore: "Google Play",
  },
  city: {
    h1: "Car rental in {city}",
    intro: "Find a car to rent in {city} from verified agencies: economy cars, sedans, SUVs and more. Prices are per day, in dirhams, and you pay on site.",
    countOne: "{count} car available",
    countMany: "{count} cars available",
    noneTitle: "No cars available right now",
    noneText: "Agencies in {city} are joining Voom. Check back soon or look at another city.",
    otherCities: "Other cities",
    faqTitle: "Renting a car in {city}",
    faq: [
      { q: "How much does a rental in {city} cost?", a: "The price depends on the model and the agency. Every listing shows the price per day in dirhams." },
      { q: "Do I need a driving licence?", a: "Yes, a valid driving licence and an ID document are required before your first booking." },
    ],
  },
  car: {
    perDay: "/ day",
    from: "From",
    book: "Book in the app",
    bookText: "Choose your dates and send your request in the Voom app. You pay on site.",
    year: "Year",
    seats: "Seats",
    fuel: "Fuel",
    transmission: "Gearbox",
    category: "Category",
    features: "Features",
    location: "City",
    rating: "{rating} out of 5 ({count} reviews)",
    noPhoto: "Photo coming soon",
    back: "Back to {city}",
    howTitle: "How to book this car",
  },
  agencies: {
    h1: "Rent out your cars with Voom",
    intro: "Voom puts your agency in front of renters in every city in Morocco. Add your cars, receive requests and manage your bookings from your phone or your computer.",
    benefitsTitle: "What you get",
    benefits: [
      { title: "More bookings", text: "Your cars are seen by renters searching in your city." },
      { title: "Simple management", text: "Accept or decline requests, follow pickups and your earnings." },
      { title: "Verified renters", text: "Renters' ID documents are checked before their first booking." },
      { title: "On phone or computer", text: "Work wherever you like, with the same account." },
    ],
    stepsTitle: "Getting started",
    steps: [
      { title: "Create your agency account", text: "In the app, with your registration number (RC or ICE) and a photo of your licence." },
      { title: "We review your agency", text: "Your file is reviewed, usually in under 24 hours." },
      { title: "Publish your cars", text: "Add photos, the price per day and the features. Your cars appear once you are approved." },
    ],
    cta: "Create my agency account",
  },
  labels: {
    category: { economy: "Economy", comfort: "Comfort", luxury: "Luxury", suv: "SUV", van: "Van" },
    transmission: { manual: "Manual", automatic: "Automatic" },
    fuel: { petrol: "Petrol", diesel: "Diesel", electric: "Electric", hybrid: "Hybrid" },
    options: {
      "GPS": "GPS", "USB charger": "USB charger", "Bluetooth": "Bluetooth", "360° camera": "360° camera",
      "Apple CarPlay / Android Auto": "Apple CarPlay / Android Auto", "Air conditioning": "Air conditioning",
      "Parking sensors": "Parking sensors", "Reversing camera": "Reversing camera", "Dashcam": "Dashcam",
      "Child seat": "Child seat", "Sunroof": "Sunroof", "Cruise control": "Cruise control",
      "Unlimited mileage": "Unlimited mileage", "Wi-Fi hotspot": "Wi-Fi hotspot", "Roof rack": "Roof rack",
    },
  },
  footer: { tagline: "Reserve. Drive. Go.", explore: "Explore", contact: "Contact", rights: "All rights reserved." },
  mock: {"explore": "Find your car", "car1": "Dacia Logan", "car2": "Peugeot 208", "car3": "Toyota C-HR", "perDay": "/ day", "request": "Send request", "dates": "12 – 15 Nov", "days": "3 days", "total": "Total", "sent": "Request sent", "confirmed": "Booking confirmed", "verified": "Verified agency", "payOnSite": "Pay on site", "pickup": "Pickup tomorrow, 10:00", "chipConfirmed": "Confirmed", "scrollHint": "Scroll"},
  dash,
  notFound: { title: "Page not found", text: "This page does not exist or has moved.", home: "Back to home" },
};

export default en;
